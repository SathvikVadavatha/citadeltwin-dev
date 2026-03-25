declare global {
  interface Window {
    cv: any;
  }
}

interface WallDetectionResult {
  walls: number[][];
}

/**
 * Detects wall segments from a 2D architectural floor plan using OpenCV.js
 * @param imageMat - OpenCV Mat object containing the image
 * @returns Object containing wall coordinates
 */
export function detectWalls(imageMat: any): WallDetectionResult {
  const cv = window.cv;
  
  if (!cv) {
    throw new Error('OpenCV.js not loaded');
  }

  // Convert to grayscale if not already
  let grayMat = new cv.Mat();
  if (imageMat.channels() === 3) {
    cv.cvtColor(imageMat, grayMat, cv.COLOR_BGR2GRAY);
  } else if (imageMat.channels() === 4) {
    cv.cvtColor(imageMat, grayMat, cv.COLOR_BGRA2GRAY);
  } else {
    grayMat = imageMat.clone();
  }

  // Apply Gaussian blur with 5x5 kernel
  const blurredMat = new cv.Mat();
  const ksize = new cv.Size(5, 5);
  cv.GaussianBlur(grayMat, blurredMat, ksize, 0, 0, cv.BORDER_DEFAULT);

  // Apply adaptive thresholding
  const threshMat = new cv.Mat();
  cv.adaptiveThreshold(
    blurredMat,
    threshMat,
    255,
    cv.ADAPTIVE_THRESH_MEAN_C,
    cv.THRESH_BINARY,
    11,
    2
  );

  // Apply Canny edge detection
  const cannyMat = new cv.Mat();
  cv.Canny(threshMat, cannyMat, 50, 150, 3, false);

  // Detect lines using HoughLinesP
  const lines = new cv.Mat();
  cv.HoughLinesP(
    cannyMat,
    lines,
    1,                    // rho: distance resolution in pixels
    Math.PI / 180,        // theta: angle resolution in radians
    80,                   // threshold: minimum number of intersections
    30,                   // minLineLength: minimum line length
    10                    // maxLineGap: maximum gap between line segments
  );

  // Extract wall coordinates
  const walls: number[][] = [];
  
  for (let i = 0; i < lines.rows; i++) {
    const line = lines.data32S.slice(i * 4, (i + 1) * 4);
    const [x1, y1, x2, y2] = line;
    walls.push([x1, y1, x2, y2]);
  }

  // Clean up memory
  grayMat.delete();
  blurredMat.delete();
  threshMat.delete();
  cannyMat.delete();
  lines.delete();

  return { walls };
}

/**
 * Load OpenCV.js if not already loaded
 */
export function loadOpenCV(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.cv) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
    script.async = true;
    
    script.onload = () => {
      // Wait for OpenCV to be ready with a 30s timeout
      let attempts = 0;
      const maxAttempts = 300; // 30 seconds at 100ms intervals
      const checkOpenCV = () => {
        if (window.cv && window.cv.Mat) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('OpenCV.js timed out during initialization — CSP may be blocking WebAssembly eval'));
        } else {
          attempts++;
          setTimeout(checkOpenCV, 100);
        }
      };
      checkOpenCV();
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load OpenCV.js'));
    };
    
    document.head.appendChild(script);
  });
}

/**
 * Convert image file to OpenCV Mat
 * @param imageFile - Image file or blob
 * @returns Promise resolving to OpenCV Mat
 */
export function imageToMat(imageFile: File | Blob): Promise<any> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const cv = window.cv;
        const mat = cv.matFromImageData(imageData);
        
        resolve(mat);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(imageFile);
  });
}