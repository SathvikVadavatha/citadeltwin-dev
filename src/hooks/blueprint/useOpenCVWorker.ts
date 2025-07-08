import { useState, useCallback, useEffect, useRef } from 'react';
import { logger } from '@/utils/logger';
import { DetectedObject } from './types/processingTypes';

interface OpenCVWorkerState {
  isLoading: boolean;
  isReady: boolean;
  progress: number;
  status: 'initializing' | 'ready' | 'processing' | 'error';
  error?: string;
}

interface WorkerMessage {
  type: string;
  id?: string;
  success?: boolean;
  data?: any;
  error?: string;
}

export const useOpenCVWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequestsRef = useRef<Map<string, { resolve: Function; reject: Function }>>(new Map());
  const [state, setState] = useState<OpenCVWorkerState>({
    isLoading: false,
    isReady: false,
    progress: 0,
    status: 'initializing'
  });

  // Initialize worker
  const initializeWorker = useCallback(() => {
    if (workerRef.current) {
      return;
    }

    try {
      logger.info('🔄 Initializing OpenCV Web Worker', 'OpenCV Worker');
      setState(prev => ({ ...prev, isLoading: true, progress: 10, status: 'initializing' }));

      workerRef.current = new Worker('/opencv-worker.js');

      workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
        const { type, id, success, data, error } = event.data;

        switch (type) {
          case 'WORKER_READY':
            logger.info('✅ OpenCV Worker ready, loading OpenCV...', 'OpenCV Worker');
            setState(prev => ({ ...prev, progress: 30 }));
            // Start loading OpenCV
            loadOpenCV();
            break;

          case 'OPENCV_LOADED':
            logger.info('✅ OpenCV loaded in worker', 'OpenCV Worker');
            setState({
              isLoading: false,
              isReady: true,
              progress: 100,
              status: 'ready'
            });
            if (id && pendingRequestsRef.current.has(id)) {
              const { resolve } = pendingRequestsRef.current.get(id)!;
              pendingRequestsRef.current.delete(id);
              resolve(true);
            }
            break;

          case 'PROCESSING_COMPLETE':
            logger.info('✅ Image processing complete', 'OpenCV Worker');
            setState(prev => ({ ...prev, isLoading: false, status: 'ready' }));
            if (id && pendingRequestsRef.current.has(id)) {
              const { resolve } = pendingRequestsRef.current.get(id)!;
              pendingRequestsRef.current.delete(id);
              resolve(data);
            }
            break;

          case 'ERROR':
            logger.error('❌ OpenCV Worker error', 'OpenCV Worker', { error });
            setState({
              isLoading: false,
              isReady: false,
              progress: 0,
              status: 'error',
              error: error || 'Unknown worker error'
            });
            if (id && pendingRequestsRef.current.has(id)) {
              const { reject } = pendingRequestsRef.current.get(id)!;
              pendingRequestsRef.current.delete(id);
              reject(new Error(error || 'Worker processing failed'));
            }
            break;
        }
      };

      workerRef.current.onerror = (error) => {
        logger.error('❌ OpenCV Worker script error', 'OpenCV Worker', { error });
        setState({
          isLoading: false,
          isReady: false,
          progress: 0,
          status: 'error',
          error: 'Worker failed to load - browser may not support Web Workers'
        });
      };

    } catch (error) {
      logger.error('❌ Failed to create OpenCV Worker', 'OpenCV Worker', { error });
      setState({
        isLoading: false,
        isReady: false,
        progress: 0,
        status: 'error',
        error: 'Web Workers not supported'
      });
    }
  }, []);

  // Load OpenCV in worker
  const loadOpenCV = useCallback(() => {
    if (!workerRef.current) {
      throw new Error('Worker not initialized');
    }

    const id = Math.random().toString(36).substr(2, 9);
    
    return new Promise((resolve, reject) => {
      pendingRequestsRef.current.set(id, { resolve, reject });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        if (pendingRequestsRef.current.has(id)) {
          pendingRequestsRef.current.delete(id);
          reject(new Error('OpenCV loading timeout'));
        }
      }, 30000);

      workerRef.current!.postMessage({
        type: 'LOAD_OPENCV',
        id
      });
    });
  }, []);

  // Process image with OpenCV
  const processImage = useCallback(async (imageUrl: string): Promise<DetectedObject[]> => {
    if (!workerRef.current || !state.isReady) {
      throw new Error('OpenCV Worker not ready');
    }

    setState(prev => ({ ...prev, isLoading: true, status: 'processing', progress: 0 }));

    try {
      // Load image and get image data
      const imageData = await loadImageData(imageUrl);
      setState(prev => ({ ...prev, progress: 40 }));

      const id = Math.random().toString(36).substr(2, 9);

      return new Promise((resolve, reject) => {
        pendingRequestsRef.current.set(id, { resolve, reject });

        // Timeout after 60 seconds
        setTimeout(() => {
          if (pendingRequestsRef.current.has(id)) {
            pendingRequestsRef.current.delete(id);
            reject(new Error('Image processing timeout'));
          }
        }, 60000);

        workerRef.current!.postMessage({
          type: 'PROCESS_IMAGE',
          id,
          data: {
            imageData: Array.from(imageData.data), // Convert Uint8ClampedArray to array
            width: imageData.width,
            height: imageData.height
          }
        });

        setState(prev => ({ ...prev, progress: 70 }));
      });

    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, status: 'error' }));
      throw error;
    }
  }, [state.isReady]);

  // Helper function to load image data
  const loadImageData = useCallback(async (imageUrl: string): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      if (imageUrl.startsWith('http') && !imageUrl.includes(window.location.hostname)) {
        img.crossOrigin = 'anonymous';
      }

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Canvas context not available');
          }

          // Resize to 512x512 for consistency
          canvas.width = 512;
          canvas.height = 512;
          
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, 512, 512);
          ctx.drawImage(img, 0, 0, 512, 512);
          
          const imageData = ctx.getImageData(0, 0, 512, 512);
          resolve(imageData);
        } catch (error) {
          reject(new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = imageUrl;
    });
  }, []);

  // Initialize worker on mount
  useEffect(() => {
    initializeWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      pendingRequestsRef.current.clear();
    };
  }, [initializeWorker]);

  // Retry initialization
  const retryInitialization = useCallback(() => {
    setState({
      isLoading: false,
      isReady: false,
      progress: 0,
      status: 'initializing'
    });
    
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    
    pendingRequestsRef.current.clear();
    initializeWorker();
  }, [initializeWorker]);

  return {
    isReady: state.isReady,
    isLoading: state.isLoading,
    loadingState: state,
    processImage,
    retryInitialization
  };
};