declare global {
  interface Window {
    cv: any;
  }
}

import { RoomWithDimensions, ScaleInfo, EnhancedRoomDetectionResult, EnhancedRoomDetectionOptions } from './enhancedRoomDetection';

/**
 * Improved room detection with better boundary processing
 */
export function detectRoomsWithImprovedBoundaries(
  imageMat: any,
  ocrText: string = '',
  options: EnhancedRoomDetectionOptions = {}
): EnhancedRoomDetectionResult {
  const startTime = performance.now();
  const cv = window.cv;
  
  if (!cv) {
    throw new Error('OpenCV.js not loaded');
  }

  // Calculate image characteristics
  const imageArea = imageMat.cols * imageMat.rows;
  console.log(`Processing image: ${imageMat.cols}x${imageMat.rows}`);

  // Improved adaptive parameters
  const {
    targetSize = Math.min(1200, Math.max(600, Math.sqrt(imageArea) * 1.5)),
    thresholdValue = 180,
    minRoomArea = Math.max(500, Math.min(2000, imageArea * 0.001)), // Increase minimum area
    morphKernelSize = 3,
    polygonApproxFactor = 0.02, // Less aggressive approximation
    defaultScale = { pixelsPerUnit: 15, unit: 'feet' as const }
  } = options;

  const scale = detectScale(ocrText, defaultScale);

  // Step 1: Preprocess with enhanced filtering
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

  // Step 2: Enhanced preprocessing for better room boundary detection
  const enhancedMat = enhanceForRoomBoundaries(resizedMat, cv);

  // Step 3: Multi-stage threshold processing
  const binaryMat = createImprovedBinaryMask(enhancedMat, cv);

  // Step 4: Advanced morphological operations for room cleanup
  const cleanedMat = cleanupRoomBoundaries(binaryMat, cv, morphKernelSize);

  // Step 5: Detect and filter contours with improved criteria
  const rooms = detectAndProcessRooms(cleanedMat, cv, minRoomArea, polygonApproxFactor, scale);

  // Step 6: Post-process rooms for better boundaries
  const improvedRooms = postProcessRoomBoundaries(rooms);

  // Clean up memory
  grayMat.delete();
  resizedMat.delete();
  enhancedMat.delete();
  binaryMat.delete();
  cleanedMat.delete();

  console.log(`Detected ${improvedRooms.length} improved rooms`);

  const summary = generateRoomSummary(improvedRooms);
  const processingTime = performance.now() - startTime;

  return {
    rooms: improvedRooms,
    totalRooms: improvedRooms.length,
    scale,
    summary,
    imageSize: { width: targetSize, height: targetSize },
    processingTime: Math.round(processingTime)
  };
}

/**
 * Enhanced preprocessing specifically for room boundary detection
 */
function enhanceForRoomBoundaries(mat: any, cv: any): any {
  // Step 1: Noise reduction while preserving edges
  const denoised = new cv.Mat();
  cv.fastNlMeansDenoising(mat, denoised, 3, 7, 21);
  
  // Step 2: Enhance contrast for better wall detection
  const enhanced = new cv.Mat();
  cv.convertScaleAbs(denoised, enhanced, 1.3, 15);
  
  // Step 3: Apply Gaussian blur to smooth minor imperfections
  const blurred = new cv.Mat();
  cv.GaussianBlur(enhanced, blurred, new cv.Size(3, 3), 0);
  
  console.log('Applied enhanced preprocessing for room boundaries');
  
  denoised.delete();
  enhanced.delete();
  
  return blurred;
}

/**
 * Create improved binary mask with adaptive thresholding
 */
function createImprovedBinaryMask(mat: any, cv: any): any {
  // Use adaptive threshold for better handling of varying lighting
  const adaptive = new cv.Mat();
  cv.adaptiveThreshold(mat, adaptive, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 15, 2);
  
  // Combine with Otsu threshold for better results
  const otsu = new cv.Mat();
  cv.threshold(mat, otsu, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
  
  // Combine both methods
  const combined = new cv.Mat();
  cv.bitwise_and(adaptive, otsu, combined);
  
  console.log('Applied combined adaptive and Otsu thresholding');
  
  adaptive.delete();
  otsu.delete();
  
  return combined;
}

/**
 * Advanced morphological operations for room cleanup
 */
function cleanupRoomBoundaries(binaryMat: any, cv: any, kernelSize: number): any {
  // Step 1: Fill small holes in room areas
  const kernel1 = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(kernelSize, kernelSize));
  const closed = new cv.Mat();
  cv.morphologyEx(binaryMat, closed, cv.MORPH_CLOSE, kernel1);
  
  // Step 2: Remove small noise
  const kernel2 = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(kernelSize + 1, kernelSize + 1));
  const opened = new cv.Mat();
  cv.morphologyEx(closed, opened, cv.MORPH_OPEN, kernel2);
  
  // Step 3: Final dilation to ensure room connectivity
  const kernel3 = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
  const dilated = new cv.Mat();
  cv.dilate(opened, dilated, kernel3);
  
  console.log('Applied advanced morphological cleanup');
  
  kernel1.delete();
  kernel2.delete();
  kernel3.delete();
  closed.delete();
  opened.delete();
  
  return dilated;
}

/**
 * Detect and process rooms with improved criteria
 */
function detectAndProcessRooms(
  cleanedMat: any, 
  cv: any, 
  minRoomArea: number, 
  polygonApproxFactor: number, 
  scale: ScaleInfo
): RoomWithDimensions[] {
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(cleanedMat, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  const rooms: RoomWithDimensions[] = [];
  let roomNumber = 0;

  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);
    
    // Apply minimum area filter
    if (area < minRoomArea) {
      contour.delete();
      continue;
    }

    // Calculate shape metrics for validation
    const perimeter = cv.arcLength(contour, true);
    const compactness = (4 * Math.PI * area) / (perimeter * perimeter);
    
    // Filter out very elongated or complex shapes (likely not rooms)
    if (compactness < 0.2) {
      contour.delete();
      continue;
    }

    const boundingRect = cv.boundingRect(contour);
    const aspectRatio = Math.max(boundingRect.width, boundingRect.height) / 
                       Math.min(boundingRect.width, boundingRect.height);
    
    // Filter out extremely elongated shapes (likely corridors or noise)
    if (aspectRatio > 8) {
      contour.delete();
      continue;
    }

    // Approximate contour to polygon with better parameters
    const approxPoly = new cv.Mat();
    cv.approxPolyDP(contour, approxPoly, polygonApproxFactor * perimeter, true);

    // Extract and validate polygon points
    const points: Array<{ x: number; y: number }> = [];
    for (let j = 0; j < approxPoly.rows; j++) {
      const point = approxPoly.data32S.slice(j * 2, (j + 1) * 2);
      points.push({ x: Math.round(point[0]), y: Math.round(point[1]) });
    }

    // Skip if polygon has too many points (likely noise)
    if (points.length > 20) {
      contour.delete();
      approxPoly.delete();
      continue;
    }

    roomNumber++;

    // Calculate dimensions
    const pixelWidth = boundingRect.width;
    const pixelLength = boundingRect.height;
    const realWidth = pixelWidth / scale.pixelsPerUnit;
    const realLength = pixelLength / scale.pixelsPerUnit;
    const realArea = area / (scale.pixelsPerUnit * scale.pixelsPerUnit);

    const room: RoomWithDimensions = {
      id: i,
      name: `Room ${roomNumber}`,
      type: 'room',
      dimensions: {
        width: pixelWidth,
        length: pixelLength,
        area: Math.round(area),
        perimeter: Math.round(perimeter),
        units: 'pixels'
      },
      realWorldDimensions: {
        width: Math.round(realWidth * 10) / 10,
        length: Math.round(realLength * 10) / 10,
        area: Math.round(realArea * 10) / 10,
        units: scale.unit
      },
      confidence: calculateImprovedConfidence(area, perimeter, points.length, compactness, aspectRatio),
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

  contours.delete();
  hierarchy.delete();

  return rooms;
}

/**
 * Post-process room boundaries for better shapes
 */
function postProcessRoomBoundaries(rooms: RoomWithDimensions[]): RoomWithDimensions[] {
  return rooms.map(room => {
    // Smooth polygon points
    const smoothedPoints = smoothPolygonPoints(room.points);
    
    // Regularize rectangular rooms
    const regularizedPoints = regularizeRectangularRoom(smoothedPoints);
    
    return {
      ...room,
      points: regularizedPoints
    };
  });
}

/**
 * Smooth polygon points to reduce jagged edges
 */
function smoothPolygonPoints(points: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
  if (points.length < 3) return points;
  
  const smoothed: Array<{ x: number; y: number }> = [];
  
  for (let i = 0; i < points.length; i++) {
    const prev = points[(i - 1 + points.length) % points.length];
    const curr = points[i];
    const next = points[(i + 1) % points.length];
    
    // Apply gentle smoothing
    const smoothX = (prev.x + curr.x * 2 + next.x) / 4;
    const smoothY = (prev.y + curr.y * 2 + next.y) / 4;
    
    smoothed.push({
      x: Math.round(smoothX),
      y: Math.round(smoothY)
    });
  }
  
  return smoothed;
}

/**
 * Regularize rooms that appear to be rectangular
 */
function regularizeRectangularRoom(points: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
  if (points.length !== 4) return points;
  
  // Check if the room is roughly rectangular
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));
  
  // If points are close to forming a rectangle, regularize them
  const tolerance = 10; // pixels
  const canRegularize = points.every(p => 
    (Math.abs(p.x - minX) < tolerance || Math.abs(p.x - maxX) < tolerance) &&
    (Math.abs(p.y - minY) < tolerance || Math.abs(p.y - maxY) < tolerance)
  );
  
  if (canRegularize) {
    return [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY }
    ];
  }
  
  return points;
}

/**
 * Calculate improved confidence score
 */
function calculateImprovedConfidence(
  area: number, 
  perimeter: number, 
  pointCount: number, 
  compactness: number, 
  aspectRatio: number
): number {
  let confidence = 0.4; // Base confidence
  
  // Area factor (reasonable room sizes get higher confidence)
  if (area > 1000 && area < 10000) confidence += 0.3;
  else if (area > 500) confidence += 0.2;
  
  // Shape simplicity factor
  if (pointCount <= 4) confidence += 0.2;
  else if (pointCount <= 8) confidence += 0.1;
  
  // Compactness factor (more compact shapes are more likely to be rooms)
  if (compactness > 0.5) confidence += 0.2;
  else if (compactness > 0.3) confidence += 0.1;
  
  // Aspect ratio factor (reasonable proportions)
  if (aspectRatio <= 3) confidence += 0.1;
  
  return Math.min(0.95, Math.max(0.1, confidence));
}

// Utility functions from original file
function detectScale(ocrText: string, defaultScale: { pixelsPerUnit: number; unit: 'feet' | 'meters' }): ScaleInfo {
  const scalePatterns = [
    /1\/4['"]?\s*=\s*1['"]?\s*-?\s*0['"]?/i,
    /1\/8['"]?\s*=\s*1['"]?\s*-?\s*0['"]?/i,
    /1\/2['"]?\s*=\s*1['"]?\s*-?\s*0['"]?/i,
    /scale\s*[:\-=]\s*1\s*[:\-=]\s*(\d+)/i,
    /(\d+)\s*mm\s*=\s*1\s*m/i,
  ];

  for (const pattern of scalePatterns) {
    const match = ocrText.match(pattern);
    if (match) {
      let pixelsPerUnit = defaultScale.pixelsPerUnit;
      let unit: 'feet' | 'meters' = 'feet';
      
      if (match[0].includes('1/4')) {
        pixelsPerUnit = 20;
        unit = 'feet';
      } else if (match[0].includes('1/8')) {
        pixelsPerUnit = 10;
        unit = 'feet';
      } else if (match[0].includes('mm')) {
        pixelsPerUnit = 50;
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