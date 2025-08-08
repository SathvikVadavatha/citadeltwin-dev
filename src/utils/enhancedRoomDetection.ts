declare global {
  interface Window {
    cv: any;
  }
}

export interface RoomWithDimensions {
  id: number;
  name: string;
  type: 'bedroom' | 'bathroom' | 'kitchen' | 'living_room' | 'dining_room' | 'office' | 'closet' | 'hallway' | 'utility' | 'garage' | 'toilet' | 'unknown';
  dimensions: {
    width: number;
    length: number;
    area: number;
    perimeter: number;
    units: 'pixels' | 'feet' | 'meters';
  };
  realWorldDimensions?: {
    width: number;
    length: number;
    area: number;
    units: 'feet' | 'meters';
  };
  confidence: number;
  bounds: { x: number; y: number; width: number; height: number };
  points: Array<{ x: number; y: number }>;
}

export interface ScaleInfo {
  pixelsPerUnit: number;
  unit: 'feet' | 'meters';
  confidence: number;
  source: 'ocr' | 'reference' | 'default';
}

export interface EnhancedRoomDetectionResult {
  rooms: RoomWithDimensions[];
  totalRooms: number;
  scale: ScaleInfo;
  summary: {
    bedrooms: number;
    bathrooms: number;
    totalArea: number;
    units: string;
  };
  imageSize: { width: number; height: number };
  processingTime: number;
}

export interface EnhancedRoomDetectionOptions {
  targetSize?: number;
  thresholdValue?: number;
  minRoomArea?: number;
  morphKernelSize?: number;
  polygonApproxFactor?: number;
  defaultScale?: { pixelsPerUnit: number; unit: 'feet' | 'meters' };
}

/**
 * Enhanced room detection with dimensions and type classification
 */
export function detectRoomsWithDimensions(
  imageMat: any,
  ocrText: string = '',
  options: EnhancedRoomDetectionOptions = {}
): EnhancedRoomDetectionResult {
  const startTime = performance.now();
  const cv = window.cv;
  
  if (!cv) {
    throw new Error('OpenCV.js not loaded');
  }

  const {
    targetSize = 512,
    thresholdValue = 127,
    minRoomArea = 1000,
    morphKernelSize = 3,
    polygonApproxFactor = 0.02,
    defaultScale = { pixelsPerUnit: 20, unit: 'feet' as const }
  } = options;

  // Detect scale from OCR text or use default
  const scale = detectScale(ocrText, defaultScale);

  // Step 1: Preprocess image
  let grayMat = new cv.Mat();
  if (imageMat.channels() === 3) {
    cv.cvtColor(imageMat, grayMat, cv.COLOR_BGR2GRAY);
  } else if (imageMat.channels() === 4) {
    cv.cvtColor(imageMat, grayMat, cv.COLOR_BGRA2GRAY);
  } else {
    grayMat = imageMat.clone();
  }

  // Resize to standard size
  const resizedMat = new cv.Mat();
  const dsize = new cv.Size(targetSize, targetSize);
  cv.resize(grayMat, resizedMat, dsize, 0, 0, cv.INTER_AREA);

  // Step 2: Enhanced preprocessing for better room detection
  const enhancedMat = enhanceImageForRoomDetection(resizedMat, cv);

  // Step 3: Binary conversion
  const binaryMat = new cv.Mat();
  cv.threshold(enhancedMat, binaryMat, thresholdValue, 255, cv.THRESH_BINARY);

  // Step 4: Morphological operations
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(morphKernelSize, morphKernelSize));
  const openedMat = new cv.Mat();
  cv.morphologyEx(binaryMat, openedMat, cv.MORPH_OPEN, kernel);

  // Step 5: Detect contours
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(openedMat, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  // Step 6: Process contours into rooms with dimensions
  const rooms: RoomWithDimensions[] = [];
  
  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);
    
    if (area < minRoomArea) {
      contour.delete();
      continue;
    }

    // Get bounding rectangle
    const boundingRect = cv.boundingRect(contour);
    
    // Approximate contour to polygon
    const approxPoly = new cv.Mat();
    const perimeter = cv.arcLength(contour, true);
    cv.approxPolyDP(contour, approxPoly, polygonApproxFactor * perimeter, true);

    // Extract polygon points
    const points: Array<{ x: number; y: number }> = [];
    for (let j = 0; j < approxPoly.rows; j++) {
      const point = approxPoly.data32S.slice(j * 2, (j + 1) * 2);
      points.push({ x: Math.round(point[0]), y: Math.round(point[1]) });
    }

    // Calculate dimensions
    const pixelWidth = boundingRect.width;
    const pixelLength = boundingRect.height;
    const pixelArea = area;
    const pixelPerimeter = perimeter;

    // Convert to real-world dimensions
    const realWidth = pixelWidth / scale.pixelsPerUnit;
    const realLength = pixelLength / scale.pixelsPerUnit;
    const realArea = pixelArea / (scale.pixelsPerUnit * scale.pixelsPerUnit);

    // Classify room type based on size and shape
    const roomType = classifyRoomType(realWidth, realLength, realArea, ocrText, boundingRect);

    const room: RoomWithDimensions = {
      id: i,
      name: generateRoomName(roomType, i),
      type: roomType,
      dimensions: {
        width: pixelWidth,
        length: pixelLength,
        area: Math.round(pixelArea),
        perimeter: Math.round(pixelPerimeter),
        units: 'pixels'
      },
      realWorldDimensions: {
        width: Math.round(realWidth * 10) / 10,
        length: Math.round(realLength * 10) / 10,
        area: Math.round(realArea * 10) / 10,
        units: scale.unit
      },
      confidence: calculateRoomConfidence(area, perimeter, points.length),
      bounds: {
        x: boundingRect.x,
        y: boundingRect.y,
        width: boundingRect.width,
        height: boundingRect.height
      },
      points
    };

    rooms.push(room);

    contour.delete();
    approxPoly.delete();
  }

  // Clean up memory
  grayMat.delete();
  resizedMat.delete();
  enhancedMat.delete();
  binaryMat.delete();
  openedMat.delete();
  kernel.delete();
  contours.delete();
  hierarchy.delete();

  // Generate summary
  const summary = generateRoomSummary(rooms);
  const processingTime = performance.now() - startTime;

  return {
    rooms,
    totalRooms: rooms.length,
    scale,
    summary,
    imageSize: { width: targetSize, height: targetSize },
    processingTime: Math.round(processingTime)
  };
}

/**
 * Enhanced image preprocessing for better room detection
 */
function enhanceImageForRoomDetection(mat: any, cv: any): any {
  // Apply bilateral filter to reduce noise while preserving edges
  const filteredMat = new cv.Mat();
  cv.bilateralFilter(mat, filteredMat, 9, 75, 75);
  
  // Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
  const clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
  const enhancedMat = new cv.Mat();
  clahe.apply(filteredMat, enhancedMat);
  
  filteredMat.delete();
  clahe.delete();
  
  return enhancedMat;
}

/**
 * Detect scale from OCR text or use default
 */
function detectScale(ocrText: string, defaultScale: { pixelsPerUnit: number; unit: 'feet' | 'meters' }): ScaleInfo {
  // Common scale patterns in architectural drawings
  const scalePatterns = [
    /1\/4['"]?\s*=\s*1['"]?\s*-?\s*0['"]?/i, // 1/4" = 1'-0"
    /1\/8['"]?\s*=\s*1['"]?\s*-?\s*0['"]?/i, // 1/8" = 1'-0"
    /1\/2['"]?\s*=\s*1['"]?\s*-?\s*0['"]?/i, // 1/2" = 1'-0"
    /scale\s*[:\-=]\s*1\s*[:\-=]\s*(\d+)/i,  // Scale: 1:100
    /(\d+)\s*mm\s*=\s*1\s*m/i,                // 10mm = 1m
  ];

  for (const pattern of scalePatterns) {
    const match = ocrText.match(pattern);
    if (match) {
      // Extract scale factor and determine pixels per unit
      let pixelsPerUnit = defaultScale.pixelsPerUnit;
      let unit: 'feet' | 'meters' = 'feet';
      
      if (match[0].includes('1/4')) {
        pixelsPerUnit = 20; // Typical for 1/4" = 1'-0"
        unit = 'feet';
      } else if (match[0].includes('1/8')) {
        pixelsPerUnit = 10; // Typical for 1/8" = 1'-0"
        unit = 'feet';
      } else if (match[0].includes('mm')) {
        pixelsPerUnit = 50; // Typical for metric
        unit = 'meters';
      }
      
      return {
        pixelsPerUnit,
        unit,
        confidence: 0.8,
        source: 'ocr'
      };
    }
  }

  return {
    pixelsPerUnit: defaultScale.pixelsPerUnit,
    unit: defaultScale.unit,
    confidence: 0.3,
    source: 'default'
  };
}

/**
 * Classify room type based on dimensions and context
 */
function classifyRoomType(
  width: number, 
  length: number, 
  area: number, 
  ocrText: string,
  bounds: any
): RoomWithDimensions['type'] {
  // Size thresholds (in feet)
  const areaThresholds = {
    toilet: { min: 6, max: 25 },
    bathroom: { min: 25, max: 80 },
    closet: { min: 4, max: 40 },
    utility: { min: 20, max: 80 },
    kitchen: { min: 60, max: 300 },
    bedroom: { min: 80, max: 400 },
    living_room: { min: 150, max: 600 },
    dining_room: { min: 80, max: 250 },
    office: { min: 60, max: 200 },
    garage: { min: 200, max: 1000 },
    hallway: { min: 10, max: 100 }
  };

  // Check OCR text for room labels near this area
  const roomLabels = extractRoomLabelsFromOCR(ocrText);
  for (const label of roomLabels) {
    if (label.toLowerCase().includes('bed')) return 'bedroom';
    if (label.toLowerCase().includes('bath')) return 'bathroom';
    if (label.toLowerCase().includes('toilet') || label.toLowerCase().includes('wc')) return 'toilet';
    if (label.toLowerCase().includes('kitchen') || label.toLowerCase().includes('kit')) return 'kitchen';
    if (label.toLowerCase().includes('living') || label.toLowerCase().includes('family')) return 'living_room';
    if (label.toLowerCase().includes('dining')) return 'dining_room';
    if (label.toLowerCase().includes('office') || label.toLowerCase().includes('study')) return 'office';
    if (label.toLowerCase().includes('closet') || label.toLowerCase().includes('wardrobe')) return 'closet';
    if (label.toLowerCase().includes('garage')) return 'garage';
    if (label.toLowerCase().includes('utility') || label.toLowerCase().includes('laundry')) return 'utility';
    if (label.toLowerCase().includes('hall')) return 'hallway';
  }

  // Classify based on area
  for (const [roomType, thresholds] of Object.entries(areaThresholds)) {
    if (area >= thresholds.min && area <= thresholds.max) {
      // Additional checks for specific room types
      if (roomType === 'toilet' && (width < 4 || length < 4)) return 'toilet';
      if (roomType === 'bathroom' && area < 80) return 'bathroom';
      if (roomType === 'hallway' && (width < 4 || length < 4)) return 'hallway';
      if (roomType === 'closet' && area < 40) return 'closet';
      
      return roomType as RoomWithDimensions['type'];
    }
  }

  // Shape-based classification
  const aspectRatio = Math.max(width, length) / Math.min(width, length);
  if (aspectRatio > 4 && area < 100) return 'hallway';
  if (area < 25) return 'toilet';
  if (area < 80) return 'bathroom';

  return 'unknown';
}

/**
 * Extract room labels from OCR text
 */
function extractRoomLabelsFromOCR(ocrText: string): string[] {
  const roomKeywords = [
    'bedroom', 'bed room', 'master bed', 'guest room',
    'bathroom', 'bath room', 'master bath', 'guest bath',
    'toilet', 'wc', 'powder room',
    'kitchen', 'kit', 'kitchenette',
    'living room', 'family room', 'great room', 'lounge',
    'dining room', 'dining area',
    'office', 'study', 'den',
    'closet', 'walk-in', 'wardrobe',
    'garage', 'carport',
    'utility', 'laundry', 'mud room',
    'hallway', 'corridor', 'hall', 'foyer', 'entry'
  ];

  const labels: string[] = [];
  const lines = ocrText.toLowerCase().split('\n');

  for (const line of lines) {
    for (const keyword of roomKeywords) {
      if (line.includes(keyword)) {
        labels.push(line.trim());
        break;
      }
    }
  }

  return labels;
}

/**
 * Generate room name based on type and index
 */
function generateRoomName(type: RoomWithDimensions['type'], index: number): string {
  const typeNames = {
    bedroom: 'Bedroom',
    bathroom: 'Bathroom',
    toilet: 'Toilet',
    kitchen: 'Kitchen',
    living_room: 'Living Room',
    dining_room: 'Dining Room',
    office: 'Office',
    closet: 'Closet',
    hallway: 'Hallway',
    utility: 'Utility Room',
    garage: 'Garage',
    unknown: 'Room'
  };

  const baseName = typeNames[type];
  
  // Add number only if it's not a unique room type
  if (['kitchen', 'living_room', 'dining_room', 'garage'].includes(type)) {
    return baseName;
  }
  
  return `${baseName} ${index + 1}`;
}

/**
 * Calculate confidence score for room detection
 */
function calculateRoomConfidence(area: number, perimeter: number, pointCount: number): number {
  let confidence = 0.5; // Base confidence
  
  // Area factor (larger rooms are more reliable)
  if (area > 2000) confidence += 0.2;
  else if (area > 1000) confidence += 0.1;
  
  // Shape factor (simpler shapes are more reliable)
  if (pointCount <= 6) confidence += 0.2;
  else if (pointCount <= 10) confidence += 0.1;
  
  // Compactness factor
  const compactness = (4 * Math.PI * area) / (perimeter * perimeter);
  if (compactness > 0.7) confidence += 0.1;
  
  return Math.min(0.95, confidence);
}

/**
 * Generate summary statistics
 */
function generateRoomSummary(rooms: RoomWithDimensions[]): {
  bedrooms: number;
  bathrooms: number;
  totalArea: number;
  units: string;
} {
  const bedrooms = rooms.filter(r => r.type === 'bedroom').length;
  const bathrooms = rooms.filter(r => r.type === 'bathroom' || r.type === 'toilet').length;
  const totalArea = rooms.reduce((sum, room) => sum + (room.realWorldDimensions?.area || 0), 0);
  const units = rooms[0]?.realWorldDimensions?.units || 'sq ft';

  return {
    bedrooms,
    bathrooms,
    totalArea: Math.round(totalArea),
    units: `sq ${units}`
  };
}