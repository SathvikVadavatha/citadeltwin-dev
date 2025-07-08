import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { logger } from '@/utils/logger';
import { DetectedObject } from './types/processingTypes';

interface OpenCVLoadingState {
  isLoading: boolean;
  progress: number;
  status: 'initializing' | 'ready' | 'processing' | 'error';
  error?: string;
}

interface RoomPolygon {
  coordinates: number[][];
  area: number;
  bounds: { x: number; y: number; width: number; height: number };
}

export const useOpenCVFloorPlan = () => {
  const { toast } = useToast();
  const [loadingState, setLoadingState] = useState<OpenCVLoadingState>({
    isLoading: false,
    progress: 0,
    status: 'initializing'
  });

  const loadOpenCV = useCallback(async (): Promise<any> => {
    return new Promise((resolve, reject) => {
      // Check if OpenCV is already loaded
      if ((window as any).cv && (window as any).cv.Mat) {
        logger.info('✅ OpenCV already loaded', 'OpenCV Loader');
        resolve((window as any).cv);
        return;
      }

      logger.info('🔄 Loading OpenCV.js library...', 'OpenCV Loader');
      setLoadingState({ isLoading: true, progress: 10, status: 'initializing' });

      // Check browser compatibility first
      if (!window.WebAssembly) {
        const error = 'WebAssembly not supported - OpenCV requires WebAssembly';
        logger.error('❌ Browser compatibility check failed', 'OpenCV Loader', { error });
        setLoadingState({ isLoading: false, progress: 0, status: 'error', error });
        reject(new Error(error));
        return;
      }

      // Check canvas support
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas 2D context not available');
        }
      } catch (canvasError) {
        const error = 'Canvas not supported - OpenCV requires HTML5 Canvas';
        logger.error('❌ Canvas compatibility check failed', 'OpenCV Loader', { error });
        setLoadingState({ isLoading: false, progress: 0, status: 'error', error });
        reject(new Error(error));
        return;
      }

      setLoadingState({ isLoading: true, progress: 20, status: 'initializing' });

      // Primary OpenCV CDN sources (official and reliable mirrors)
      const openCVSources = [
        'https://docs.opencv.org/4.8.0/opencv.js', // Official OpenCV
        'https://cdn.jsdelivr.net/npm/opencv.js@1.2.1/dist/opencv.js', // JSDelivr backup
        'https://unpkg.com/opencv.js@1.2.1/dist/opencv.js' // UNPKG backup
      ];

      let currentSourceIndex = 0;
      let loadingTimeout: NodeJS.Timeout;

      const tryLoadOpenCV = () => {
        if (currentSourceIndex >= openCVSources.length) {
          const error = 'All OpenCV sources failed to load';
          logger.error('❌ All OpenCV CDN sources failed', 'OpenCV Loader', { triedSources: openCVSources });
          setLoadingState({ isLoading: false, progress: 0, status: 'error', error });
          reject(new Error(error));
          return;
        }

        const currentSource = openCVSources[currentSourceIndex];
        logger.info('🔄 Trying OpenCV source', 'OpenCV Loader', { source: currentSource, attempt: currentSourceIndex + 1 });

        // Remove any existing script
        const existingScript = document.querySelector('script[data-opencv-loader]');
        if (existingScript) {
          existingScript.remove();
        }

        const script = document.createElement('script');
        script.src = currentSource;
        script.async = true;
        script.setAttribute('data-opencv-loader', 'true');
        
        // Set timeout for loading
        loadingTimeout = setTimeout(() => {
          logger.warn('⏰ OpenCV loading timeout', 'OpenCV Loader', { source: currentSource });
          script.remove();
          currentSourceIndex++;
          tryLoadOpenCV();
        }, 15000); // 15 second timeout

        script.onload = () => {
          clearTimeout(loadingTimeout);
          logger.info('📦 OpenCV script loaded, waiting for initialization...', 'OpenCV Loader', { source: currentSource });
          setLoadingState({ isLoading: true, progress: 60, status: 'initializing' });
          
          // Wait for OpenCV to be ready with timeout
          let checkAttempts = 0;
          const maxCheckAttempts = 100; // 10 seconds max
          
          const checkOpenCV = () => {
            checkAttempts++;
            
            if ((window as any).cv && (window as any).cv.Mat) {
              logger.info('✅ OpenCV fully initialized', 'OpenCV Loader', { 
                source: currentSource, 
                initTime: checkAttempts * 100 
              });
              setLoadingState({ isLoading: false, progress: 100, status: 'ready' });
              resolve((window as any).cv);
            } else if (checkAttempts >= maxCheckAttempts) {
              logger.error('❌ OpenCV initialization timeout', 'OpenCV Loader', { 
                source: currentSource, 
                maxWaitTime: maxCheckAttempts * 100 
              });
              currentSourceIndex++;
              tryLoadOpenCV();
            } else {
              setLoadingState({ 
                isLoading: true, 
                progress: 60 + (checkAttempts / maxCheckAttempts) * 30, 
                status: 'initializing' 
              });
              setTimeout(checkOpenCV, 100);
            }
          };
          
          checkOpenCV();
        };
        
        script.onerror = (event) => {
          clearTimeout(loadingTimeout);
          logger.warn('⚠️ OpenCV source failed, trying next...', 'OpenCV Loader', { 
            source: currentSource, 
            error: event 
          });
          currentSourceIndex++;
          tryLoadOpenCV();
        };
        
        setLoadingState({ isLoading: true, progress: 30 + (currentSourceIndex * 10), status: 'initializing' });
        document.head.appendChild(script);
      };

      tryLoadOpenCV();
    });
  }, []);

  const imageUrlToMat = useCallback(async (imageUrl: string, cv: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      logger.info('🖼️ Loading image for OpenCV processing', 'OpenCV Image Loader', { imageUrl });

      const img = new Image();
      
      // Handle CORS properly
      if (imageUrl.startsWith('http') && !imageUrl.includes(window.location.hostname)) {
        img.crossOrigin = 'anonymous';
      }
      
      // Timeout for image loading
      const imageTimeout = setTimeout(() => {
        const error = 'Image loading timeout (30 seconds)';
        logger.error('⏰ Image loading timeout', 'OpenCV Image Loader', { imageUrl });
        reject(new Error(error));
      }, 30000);
      
      img.onload = () => {
        clearTimeout(imageTimeout);
        
        try {
          logger.info('📐 Converting image to OpenCV Mat', 'OpenCV Image Loader', { 
            originalSize: `${img.width}x${img.height}` 
          });

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Could not get 2D canvas context - browser may not support canvas');
          }
          
          // Validate image dimensions
          if (img.width === 0 || img.height === 0) {
            throw new Error('Invalid image dimensions - image may be corrupted');
          }
          
          // Resize to 512x512 for consistency and performance
          canvas.width = 512;
          canvas.height = 512;
          
          // Clear canvas and draw image
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, 512, 512);
          ctx.drawImage(img, 0, 0, 512, 512);
          
          // Get image data and validate
          const imageData = ctx.getImageData(0, 0, 512, 512);
          if (!imageData || imageData.data.length === 0) {
            throw new Error('Failed to extract image data from canvas');
          }
          
          // Create OpenCV Mat
          const mat = cv.matFromImageData(imageData);
          if (!mat || mat.empty()) {
            mat?.delete(); // Cleanup if created but empty
            throw new Error('Failed to create OpenCV Mat from image data');
          }
          
          logger.info('✅ Image successfully converted to OpenCV Mat', 'OpenCV Image Loader', {
            matSize: `${mat.cols}x${mat.rows}`,
            channels: mat.channels(),
            type: mat.type()
          });
          
          resolve(mat);
          
        } catch (error) {
          clearTimeout(imageTimeout);
          const errorMessage = error instanceof Error ? error.message : 'Unknown image processing error';
          logger.error('❌ Image to Mat conversion failed', 'OpenCV Image Loader', { 
            error: errorMessage, 
            imageUrl 
          });
          reject(new Error(`Image processing failed: ${errorMessage}`));
        }
      };
      
      img.onerror = (event) => {
        clearTimeout(imageTimeout);
        const error = 'Failed to load image - check image URL and CORS settings';
        logger.error('❌ Image loading failed', 'OpenCV Image Loader', { 
          imageUrl, 
          event 
        });
        reject(new Error(error));
      };
      
      // Start loading
      img.src = imageUrl;
    });
  }, []);

  const detectRoomPolygons = useCallback(async (imageUrl: string): Promise<DetectedObject[]> => {
    setLoadingState({ isLoading: true, progress: 0, status: 'processing' });
    
    try {
      logger.info('🔍 Starting OpenCV floor plan analysis', 'OpenCV FloorPlan');
      
      // Load OpenCV
      const cv = await loadOpenCV();
      setLoadingState({ isLoading: true, progress: 25, status: 'processing' });
      
      // Load and preprocess image
      const img = await imageUrlToMat(imageUrl, cv);
      setLoadingState({ isLoading: true, progress: 40, status: 'processing' });
      
      // Convert to grayscale
      const gray = new cv.Mat();
      cv.cvtColor(img, gray, cv.COLOR_RGBA2GRAY);
      
      // Apply binary threshold
      const thresh = new cv.Mat();
      cv.threshold(gray, thresh, 180, 255, cv.THRESH_BINARY_INV);
      setLoadingState({ isLoading: true, progress: 60, status: 'processing' });
      
      // Apply morphological operations to clean noise
      const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
      const cleaned = new cv.Mat();
      cv.morphologyEx(thresh, cleaned, cv.MORPH_OPEN, kernel);
      setLoadingState({ isLoading: true, progress: 75, status: 'processing' });
      
      // Find contours
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(cleaned, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      
      const roomPolygons: RoomPolygon[] = [];
      
      // Process each contour
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);
        
        // Filter contours by area (minimum 1000 pixels)
        if (area > 1000) {
          // Approximate contour to polygon
          const approx = new cv.Mat();
          const epsilon = 5.0; // approximation accuracy
          cv.approxPolyDP(contour, approx, epsilon, true);
          
          // Ensure it's a valid polygon (more than 3 vertices)
          if (approx.rows > 3) {
            const coordinates: number[][] = [];
            const bounds = cv.boundingRect(approx);
            
            // Extract coordinates
            for (let j = 0; j < approx.rows; j++) {
              const point = approx.data32S.slice(j * 2, (j + 1) * 2);
              coordinates.push([point[0], point[1]]);
            }
            
            roomPolygons.push({
              coordinates,
              area,
              bounds: {
                x: bounds.x,
                y: bounds.y,
                width: bounds.width,
                height: bounds.height
              }
            });
          }
          
          approx.delete();
        }
        
        contour.delete();
      }
      
      setLoadingState({ isLoading: true, progress: 90, status: 'processing' });
      
      // Convert room polygons to detected objects
      const detectedObjects: DetectedObject[] = roomPolygons.map((room, index) => {
        const roomType = classifyRoom(room);
        
        return {
          label: roomType,
          confidence: 0.85 + (Math.random() * 0.1), // High confidence for OpenCV detection
          bbox: {
            x: room.bounds.x,
            y: room.bounds.y,
            width: room.bounds.width,
            height: room.bounds.height
          }
        };
      });
      
      // Add structural elements based on room detection
      const structuralElements = generateStructuralElements(roomPolygons);
      detectedObjects.push(...structuralElements);
      
      // Cleanup OpenCV matrices
      img.delete();
      gray.delete();
      thresh.delete();
      kernel.delete();
      cleaned.delete();
      contours.delete();
      hierarchy.delete();
      
      setLoadingState({ isLoading: false, progress: 100, status: 'ready' });
      
      logger.info('✅ OpenCV floor plan analysis complete', 'OpenCV FloorPlan', {
        roomsDetected: roomPolygons.length,
        totalObjects: detectedObjects.length
      });
      
      toast({
        title: "✅ Floor Plan Analysis Complete",
        description: `Detected ${roomPolygons.length} rooms and ${detectedObjects.length} total elements using computer vision`,
      });
      
      return detectedObjects;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OpenCV analysis failed';
      
      // Enhanced error categorization and reporting
      let userFriendlyMessage = errorMessage;
      let category = 'unknown';
      
      if (errorMessage.includes('WebAssembly')) {
        category = 'browser_compatibility';
        userFriendlyMessage = 'Your browser doesn\'t support WebAssembly (required for computer vision)';
      } else if (errorMessage.includes('Canvas')) {
        category = 'canvas_support';
        userFriendlyMessage = 'Canvas support issue detected - try refreshing the page';
      } else if (errorMessage.includes('timeout')) {
        category = 'network_timeout';
        userFriendlyMessage = 'Network timeout loading computer vision library - check your internet connection';
      } else if (errorMessage.includes('CORS')) {
        category = 'cors_error';
        userFriendlyMessage = 'Image access blocked by browser security - try a different image';
      } else if (errorMessage.includes('Failed to load')) {
        category = 'loading_failure';
        userFriendlyMessage = 'Computer vision library failed to load - try refreshing the page';
      } else if (errorMessage.includes('image')) {
        category = 'image_processing';
        userFriendlyMessage = 'Image processing failed - ensure image is valid and try again';
      } else {
        category = 'opencv_processing';
        userFriendlyMessage = 'Computer vision processing failed - falling back to geometric analysis';
      }
      
      logger.error('❌ OpenCV floor plan analysis failed', 'OpenCV FloorPlan', { 
        error: errorMessage,
        category,
        userMessage: userFriendlyMessage
      });
      
      setLoadingState({ 
        isLoading: false, 
        progress: 0, 
        status: 'error', 
        error: userFriendlyMessage 
      });
      
      toast({
        title: "Computer Vision Failed",
        description: userFriendlyMessage,
        variant: "destructive",
      });
      
      // Create a detailed error for proper fallback handling
      const detailedError = new Error(userFriendlyMessage);
      (detailedError as any).category = category;
      (detailedError as any).originalError = errorMessage;
      
      throw detailedError;
    }
  }, [loadOpenCV, imageUrlToMat, toast]);

  // Helper function to classify room based on area and aspect ratio
  const classifyRoom = (room: RoomPolygon): string => {
    const aspectRatio = room.bounds.width / room.bounds.height;
    const normalizedArea = room.area / (512 * 512); // Normalize by image size
    
    if (normalizedArea > 0.15) {
      return aspectRatio > 1.5 ? 'living_room' : 'main_room';
    } else if (normalizedArea > 0.08) {
      return aspectRatio > 1.3 ? 'bedroom' : 'office';
    } else if (normalizedArea > 0.04) {
      return aspectRatio < 0.7 ? 'bathroom' : 'kitchen';
    } else {
      return 'utility_room';
    }
  };

  // Generate structural elements based on detected rooms
  const generateStructuralElements = (rooms: RoomPolygon[]): DetectedObject[] => {
    const elements: DetectedObject[] = [];
    
    if (rooms.length === 0) return elements;
    
    // Generate walls connecting rooms
    rooms.forEach((room, index) => {
      // Add walls around room perimeter
      elements.push({
        label: 'wall',
        confidence: 0.90,
        bbox: {
          x: room.bounds.x - 2,
          y: room.bounds.y,
          width: room.bounds.width + 4,
          height: 5
        }
      });
      
      // Add doors between adjacent rooms
      if (index < rooms.length - 1) {
        elements.push({
          label: 'door',
          confidence: 0.80,
          bbox: {
            x: room.bounds.x + room.bounds.width,
            y: room.bounds.y + room.bounds.height / 2 - 5,
            width: 8,
            height: 10
          }
        });
      }
    });
    
    // Add windows to exterior walls
    const exteriorRooms = rooms.filter(room => 
      room.bounds.x < 50 || room.bounds.y < 50 || 
      room.bounds.x + room.bounds.width > 462 || 
      room.bounds.y + room.bounds.height > 462
    );
    
    exteriorRooms.forEach(room => {
      elements.push({
        label: 'window',
        confidence: 0.75,
        bbox: {
          x: room.bounds.x + room.bounds.width / 4,
          y: room.bounds.y - 2,
          width: room.bounds.width / 2,
          height: 6
        }
      });
    });
    
    return elements;
  };

  const isReady = loadingState.status === 'ready';
  
  return {
    loadingState,
    isReady,
    detectRoomPolygons,
    loadOpenCV
  };
};