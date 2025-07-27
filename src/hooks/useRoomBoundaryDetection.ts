import { useState, useCallback, useRef } from 'react';
import { loadOpenCV, imageToMat } from '@/utils/wallDetection';
import { visualizeRoomBoundaries, exportRoomBoundariesAsJSON } from '@/utils/roomBoundaryDetection';
import { RoomDetectionResult, RoomDetectionOptions } from '@/utils/roomBoundaryDetection';
import { useToast } from '@/hooks/use-toast';

interface UseRoomBoundaryDetectionReturn {
  isLoading: boolean;
  isOpenCVLoading: boolean;
  openCVLoaded: boolean;
  result: RoomDetectionResult | null;
  error: string | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  detectRoomsFromFile: (file: File, options?: RoomDetectionOptions) => Promise<RoomDetectionResult | null>;
  detectRoomsFromUrl: (imageUrl: string, options?: RoomDetectionOptions) => Promise<RoomDetectionResult | null>;
  exportAsJSON: () => string | null;
  downloadJSON: () => void;
  clearResults: () => void;
  retryOpenCVLoad: () => Promise<void>;
}

export function useRoomBoundaryDetection(): UseRoomBoundaryDetectionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenCVLoading, setIsOpenCVLoading] = useState(false);
  const [openCVLoaded, setOpenCVLoaded] = useState(false);
  const [result, setResult] = useState<RoomDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const retryOpenCVLoad = useCallback(async () => {
    setIsOpenCVLoading(true);
    setError(null);
    try {
      await loadOpenCV();
      setOpenCVLoaded(true);
      toast({
        title: "OpenCV Loaded",
        description: "Computer vision library loaded successfully",
      });
    } catch (error) {
      console.error('Failed to load OpenCV:', error);
      const errorMsg = 'Failed to load OpenCV.js. Please check your internet connection and try again.';
      setError(errorMsg);
      toast({
        title: "OpenCV Load Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsOpenCVLoading(false);
    }
  }, [toast]);

  const processImage = useCallback(async (
    imageMat: any,
    options: RoomDetectionOptions = {}
  ): Promise<RoomDetectionResult | null> => {
    try {
      // Import the actual function here to avoid circular dependency
      const { detectRoomBoundaries } = await import('@/utils/roomBoundaryDetection');
      
      const detectionResult = detectRoomBoundaries(imageMat, options);
      setResult(detectionResult);

      // Visualize results on canvas
      if (canvasRef.current) {
        visualizeRoomBoundaries(detectionResult.rooms, detectionResult.imageSize, canvasRef.current);
      }

      toast({
        title: "Room Detection Complete",
        description: `Detected ${detectionResult.totalRooms} rooms in ${detectionResult.processingTime}ms`,
      });

      return detectionResult;
    } catch (error) {
      console.error('Room detection error:', error);
      toast({
        title: "Room Detection Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const detectRoomsFromFile = useCallback(async (
    file: File,
    options: RoomDetectionOptions = {}
  ): Promise<RoomDetectionResult | null> => {
    try {
      setError(null);
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        const errorMsg = `File size too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed: 10MB`;
        setError(errorMsg);
        toast({
          title: "File Too Large",
          description: errorMsg,
          variant: "destructive",
        });
        return null;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        const errorMsg = 'Please select a valid image file (PNG, JPG, GIF, BMP)';
        setError(errorMsg);
        toast({
          title: "Invalid File Type",
          description: errorMsg,
          variant: "destructive",
        });
        return null;
      }
      
      // Load OpenCV if not already loaded
      if (!openCVLoaded) {
        console.log('Loading OpenCV...');
        setIsOpenCVLoading(true);
        try {
          await loadOpenCV();
          setOpenCVLoaded(true);
        } catch (error) {
          await retryOpenCVLoad();
          if (!openCVLoaded) return null;
        } finally {
          setIsOpenCVLoading(false);
        }
      }
      
      setIsLoading(true);
      console.log('Converting file to Mat...');
      const imageMat = await imageToMat(file);
      
      const result = await processImage(imageMat, options);
      
      // Clean up
      imageMat.delete();
      
      return result;
    } catch (error) {
      console.error('Error in detectRoomsFromFile:', error);
      const errorMsg = error instanceof Error ? error.message : "Failed to process file";
      setError(errorMsg);
      toast({
        title: "Upload Error",
        description: errorMsg,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [processImage, toast, openCVLoaded, retryOpenCVLoad]);

  const detectRoomsFromUrl = useCallback(async (
    imageUrl: string,
    options: RoomDetectionOptions = {}
  ): Promise<RoomDetectionResult | null> => {
    setIsLoading(true);
    
    try {
      // Load OpenCV if not already loaded
      await loadOpenCV();
      
      // Fetch image as blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Convert to Mat and detect rooms
      const imageMat = await imageToMat(blob);
      const result = await processImage(imageMat, options);
      
      // Clean up
      imageMat.delete();
      
      return result;
    } catch (error) {
      console.error('Room detection error:', error);
      toast({
        title: "Room Detection Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [processImage, toast]);

  const exportAsJSON = useCallback((): string | null => {
    if (!result) {
      toast({
        title: "No Results",
        description: "No room detection results to export",
        variant: "destructive",
      });
      return null;
    }

    return exportRoomBoundariesAsJSON(result);
  }, [result, toast]);

  const downloadJSON = useCallback(() => {
    const jsonData = exportAsJSON();
    if (!jsonData) return;

    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `room-boundaries-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Room boundary data downloaded as JSON",
    });
  }, [exportAsJSON, toast]);

  const clearResults = useCallback(() => {
    setResult(null);
    setError(null);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, []);

  return {
    isLoading,
    isOpenCVLoading,
    openCVLoaded,
    result,
    error,
    canvasRef,
    detectRoomsFromFile,
    detectRoomsFromUrl,
    exportAsJSON,
    downloadJSON,
    clearResults,
    retryOpenCVLoad,
  };
}