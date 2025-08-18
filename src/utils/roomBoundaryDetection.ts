declare global {
  interface Window {
    cv: any;
  }
}

export interface RoomBoundary {
  id: number;
  points: Array<{ x: number; y: number }>;
  area: number;
  perimeter: number;
}

export interface RoomDetectionResult {
  rooms: RoomBoundary[];
  totalRooms: number;
  imageSize: { width: number; height: number };
  processingTime: number;
}

export interface RoomDetectionOptions {
  targetSize?: number;
  thresholdValue?: number;
  minRoomArea?: number;
  morphKernelSize?: number;
  polygonApproxFactor?: number;
  useAdvancedSegmentation?: boolean;
  invertColors?: boolean;
  wallThickness?: number;
  morphologyIterations?: number;
  snapToGrid?: boolean;
  gridSize?: number;
}

/**
 * Detects room boundaries from a 2D floor plan image using CPU-only processing
 * @param imageMat - OpenCV Mat object containing the floor plan image
 * @param options - Processing options
 * @returns Object containing detected room boundaries and metadata
 */
export function detectRoomBoundaries(
  imageMat: any,
  options: RoomDetectionOptions = {}
): RoomDetectionResult {
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
    useAdvancedSegmentation = false
  } = options;

  // Use advanced segmentation if enabled
  if (useAdvancedSegmentation) {
    const { segmentRoomsFromImage } = require('./roomSegmentation');
    const result = segmentRoomsFromImage(imageMat, options);
    return {
      rooms: result.rooms,
      totalRooms: result.rooms.length,
      imageSize: result.imageSize,
      processingTime: result.processingTime
    };
  }

  // Step 1: Convert to grayscale and resize to standard size
  let grayMat = new cv.Mat();
  if (imageMat.channels() === 3) {
    cv.cvtColor(imageMat, grayMat, cv.COLOR_BGR2GRAY);
  } else if (imageMat.channels() === 4) {
    cv.cvtColor(imageMat, grayMat, cv.COLOR_BGRA2GRAY);
  } else {
    grayMat = imageMat.clone();
  }

  // Resize to standard size (512x512)
  const resizedMat = new cv.Mat();
  const dsize = new cv.Size(targetSize, targetSize);
  cv.resize(grayMat, resizedMat, dsize, 0, 0, cv.INTER_AREA);

  // Step 2: Convert to binary format by thresholding
  const binaryMat = new cv.Mat();
  cv.threshold(resizedMat, binaryMat, thresholdValue, 255, cv.THRESH_BINARY);

  // Step 3: Use morphological operations (opening) to remove noise
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(morphKernelSize, morphKernelSize));
  const openedMat = new cv.Mat();
  cv.morphologyEx(binaryMat, openedMat, cv.MORPH_OPEN, kernel);

  // Step 4: Detect external contours representing rooms
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(openedMat, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  // Step 5: Approximate each contour to polygons and filter out small/noisy ones
  const rooms: RoomBoundary[] = [];
  
  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);
    
    // Filter out small contours
    if (area < minRoomArea) {
      contour.delete();
      continue;
    }

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

    rooms.push({
      id: i,
      points,
      area: Math.round(area),
      perimeter: Math.round(perimeter)
    });

    contour.delete();
    approxPoly.delete();
  }

  // Clean up memory
  grayMat.delete();
  resizedMat.delete();
  binaryMat.delete();
  openedMat.delete();
  kernel.delete();
  contours.delete();
  hierarchy.delete();

  const processingTime = performance.now() - startTime;

  return {
    rooms,
    totalRooms: rooms.length,
    imageSize: { width: targetSize, height: targetSize },
    processingTime: Math.round(processingTime)
  };
}

/**
 * Visualizes detected room boundaries on a canvas
 * @param rooms - Array of detected room boundaries
 * @param imageSize - Size of the processed image
 * @param canvas - HTML canvas element to draw on
 */
export function visualizeRoomBoundaries(
  rooms: RoomBoundary[],
  imageSize: { width: number; height: number },
  canvas: HTMLCanvasElement
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Set canvas size
  canvas.width = imageSize.width;
  canvas.height = imageSize.height;

  // Clear canvas
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw room boundaries
  rooms.forEach((room, index) => {
    ctx.beginPath();
    ctx.strokeStyle = `hsl(${(index * 137.5) % 360}, 70%, 50%)`;
    ctx.lineWidth = 2;
    ctx.fillStyle = `hsl(${(index * 137.5) % 360}, 70%, 90%)`;

    if (room.points.length > 0) {
      ctx.moveTo(room.points[0].x, room.points[0].y);
      for (let i = 1; i < room.points.length; i++) {
        ctx.lineTo(room.points[i].x, room.points[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Add room label
      const centerX = room.points.reduce((sum, p) => sum + p.x, 0) / room.points.length;
      const centerY = room.points.reduce((sum, p) => sum + p.y, 0) / room.points.length;
      
      ctx.fillStyle = 'black';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Room ${room.id + 1}`, centerX, centerY);
    }
  });
}

/**
 * Exports room boundary data as JSON
 * @param result - Room detection result
 * @returns JSON string containing room boundary data
 */
export function exportRoomBoundariesAsJSON(result: RoomDetectionResult): string {
  const exportData = {
    metadata: {
      totalRooms: result.totalRooms,
      imageSize: result.imageSize,
      processingTime: result.processingTime,
      timestamp: new Date().toISOString()
    },
    rooms: result.rooms.map(room => ({
      id: room.id,
      points: room.points,
      area: room.area,
      perimeter: room.perimeter
    }))
  };

  return JSON.stringify(exportData, null, 2);
}