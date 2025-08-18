import { RoomBoundary, RoomDetectionOptions } from './roomBoundaryDetection';

export interface RoomSegmentationOptions extends RoomDetectionOptions {
  invertColors?: boolean;
  wallThickness?: number;
  morphologyIterations?: number;
  minRoomArea?: number;
  snapToGrid?: boolean;
  gridSize?: number;
}

export interface SegmentationResult {
  rooms: RoomBoundary[];
  wallMask?: ImageData;
  processingTime: number;
  imageSize: { width: number; height: number };
}

export function segmentRoomsFromImage(
  imageMat: any,
  options: RoomSegmentationOptions = {}
): SegmentationResult {
  const startTime = performance.now();
  
  const {
    invertColors = true,
    wallThickness = 3,
    morphologyIterations = 2,
    minRoomArea = 500,
    snapToGrid = true,
    gridSize = 10,
    targetSize = 800
  } = options;

  const originalSize = { width: imageMat.cols, height: imageMat.rows };
  
  // Step 1: Preprocessing
  const processed = preprocessImage(imageMat, targetSize, invertColors);
  
  // Step 2: Create wall mask using morphological operations
  const wallMask = createWallMask(processed, wallThickness, morphologyIterations);
  
  // Step 3: Find room regions using connected components
  const roomRegions = findRoomRegions(wallMask, minRoomArea);
  
  // Step 4: Extract room boundaries and post-process
  const rooms = extractRoomBoundaries(roomRegions, originalSize, {
    snapToGrid,
    gridSize,
    targetSize
  });
  
  // Cleanup OpenCV Mats
  processed.delete();
  wallMask.delete();
  roomRegions.delete();
  
  const processingTime = performance.now() - startTime;
  
  return {
    rooms,
    processingTime,
    imageSize: originalSize
  };
}

function preprocessImage(imageMat: any, targetSize: number, invertColors: boolean): any {
  const cv = (window as any).cv;
  
  // Convert to grayscale
  const gray = new cv.Mat();
  cv.cvtColor(imageMat, gray, cv.COLOR_RGBA2GRAY);
  
  // Resize while maintaining aspect ratio
  const scale = Math.min(targetSize / gray.cols, targetSize / gray.rows);
  const newWidth = Math.round(gray.cols * scale);
  const newHeight = Math.round(gray.rows * scale);
  
  const resized = new cv.Mat();
  cv.resize(gray, resized, new cv.Size(newWidth, newHeight));
  gray.delete();
  
  // Apply Gaussian blur to reduce noise
  const blurred = new cv.Mat();
  cv.GaussianBlur(resized, blurred, new cv.Size(5, 5), 0);
  resized.delete();
  
  // Apply Otsu thresholding for better binary conversion
  const binary = new cv.Mat();
  cv.threshold(blurred, binary, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
  blurred.delete();
  
  // Invert if needed (walls should be white, rooms black)
  if (invertColors) {
    cv.bitwise_not(binary, binary);
  }
  
  return binary;
}

function createWallMask(binaryMat: any, wallThickness: number, iterations: number): any {
  const cv = (window as any).cv;
  
  // Create morphological kernel
  const kernelSize = wallThickness * 2 + 1;
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(kernelSize, kernelSize));
  
  // Apply closing to connect nearby wall segments
  const closed = new cv.Mat();
  cv.morphologyEx(binaryMat, closed, cv.MORPH_CLOSE, kernel, new cv.Point(-1, -1), iterations);
  
  // Apply opening to remove small noise
  const opened = new cv.Mat();
  cv.morphologyEx(closed, opened, cv.MORPH_OPEN, kernel, new cv.Point(-1, -1), 1);
  closed.delete();
  
  kernel.delete();
  return opened;
}

function findRoomRegions(wallMask: any, minRoomArea: number): any {
  const cv = (window as any).cv;
  
  // Invert wall mask to get room areas (walls = 0, rooms = 255)
  const roomMask = new cv.Mat();
  cv.bitwise_not(wallMask, roomMask);
  
  // Find connected components (rooms)
  const labels = new cv.Mat();
  const stats = new cv.Mat();
  const centroids = new cv.Mat();
  
  const numLabels = cv.connectedComponentsWithStats(roomMask, labels, stats, centroids);
  
  // Filter out small components
  const filteredLabels = new cv.Mat();
  labels.copyTo(filteredLabels);
  
  for (let i = 1; i < numLabels; i++) {
    const area = stats.intPtr(i, cv.CC_STAT_AREA)[0];
    if (area < minRoomArea) {
      // Set small components to background (0)
      const mask = new cv.Mat();
      cv.compare(labels, new cv.Mat.ones(labels.rows, labels.cols, cv.CV_32S).mul(new cv.Scalar(i)), mask, cv.CMP_EQ);
      filteredLabels.setTo(new cv.Scalar(0), mask);
      mask.delete();
    }
  }
  
  roomMask.delete();
  labels.delete();
  stats.delete();
  centroids.delete();
  
  return filteredLabels;
}

function extractRoomBoundaries(
  roomRegions: any,
  originalSize: { width: number; height: number },
  options: { snapToGrid: boolean; gridSize: number; targetSize: number }
): RoomBoundary[] {
  const cv = (window as any).cv;
  const rooms: RoomBoundary[] = [];
  
  // Get unique labels (room IDs)
  const minMax = cv.minMaxLoc(roomRegions);
  const maxLabel = minMax.maxVal;
  
  const scaleX = originalSize.width / roomRegions.cols;
  const scaleY = originalSize.height / roomRegions.rows;
  
  for (let label = 1; label <= maxLabel; label++) {
    // Create mask for this room
    const roomMask = new cv.Mat();
    cv.compare(roomRegions, new cv.Mat.ones(roomRegions.rows, roomRegions.cols, cv.CV_32S).mul(new cv.Scalar(label)), roomMask, cv.CMP_EQ);
    
    // Find contours for this room
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(roomMask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    if (contours.size() > 0) {
      // Use the largest contour
      let largestContour = contours.get(0);
      let maxArea = cv.contourArea(largestContour);
      
      for (let i = 1; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);
        if (area > maxArea) {
          largestContour = contour;
          maxArea = area;
        }
      }
      
      // Simplify contour to reduce noise
      const epsilon = 0.02 * cv.arcLength(largestContour, true);
      const simplified = new cv.Mat();
      cv.approxPolyDP(largestContour, simplified, epsilon, true);
      
      // Convert to points and scale back to original size
      const points: [number, number][] = [];
      for (let i = 0; i < simplified.rows; i++) {
        const point = simplified.data32S.slice(i * 2, i * 2 + 2);
        let x = point[0] * scaleX;
        let y = point[1] * scaleY;
        
        // Snap to grid if enabled
        if (options.snapToGrid) {
          x = Math.round(x / options.gridSize) * options.gridSize;
          y = Math.round(y / options.gridSize) * options.gridSize;
        }
        
        points.push([x, y]);
      }
      
      // Calculate area and perimeter in original coordinates
      const scaledArea = maxArea * scaleX * scaleY;
      const perimeter = cv.arcLength(simplified, true) * Math.sqrt(scaleX * scaleY);
      
      rooms.push({
        id: label,
        points: points.map(([x, y]) => ({ x, y })),
        area: scaledArea,
        perimeter
      });
      
      simplified.delete();
    }
    
    roomMask.delete();
    contours.delete();
    hierarchy.delete();
  }
  
  return rooms;
}

export function createDebugCanvas(
  imageMat: any,
  wallMask: any,
  rooms: RoomBoundary[]
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  canvas.width = imageMat.cols;
  canvas.height = imageMat.rows;
  
  // Draw original image
  const imgData = new ImageData(new Uint8ClampedArray(imageMat.data), imageMat.cols, imageMat.rows);
  ctx.putImageData(imgData, 0, 0);
  
  // Draw wall mask overlay
  if (wallMask) {
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = 'red';
    const wallData = wallMask.data;
    const imageData = ctx.createImageData(wallMask.cols, wallMask.rows);
    
    for (let i = 0; i < wallData.length; i++) {
      const pixel = i * 4;
      if (wallData[i] > 128) {
        imageData.data[pixel] = 255;     // Red
        imageData.data[pixel + 1] = 0;   // Green  
        imageData.data[pixel + 2] = 0;   // Blue
        imageData.data[pixel + 3] = 128; // Alpha
      }
    }
    ctx.putImageData(imageData, 0, 0);
    ctx.globalAlpha = 1.0;
  }
  
  // Draw room boundaries
  rooms.forEach((room, index) => {
    ctx.strokeStyle = `hsl(${(index * 60) % 360}, 70%, 50%)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    room.points.forEach((point, i) => {
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.closePath();
    ctx.stroke();
  });
  
  return canvas;
}