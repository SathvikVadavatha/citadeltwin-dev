import { useState, useCallback, useRef } from 'react';
import { loadOpenCV, imageToMat } from '@/utils/wallDetection';
import { visualizeRoomBoundaries, exportRoomBoundariesAsJSON } from '@/utils/roomBoundaryDetection';
import { RoomDetectionResult, RoomDetectionOptions } from '@/utils/roomBoundaryDetection';
import { useToast } from '@/components/ui/use-toast';

interface UseRoomBoundaryDetectionReturn {
  isLoading: boolean;
  result: RoomDetectionResult | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  detectRoomsFromFile: (file: File, options?: RoomDetectionOptions) => Promise<RoomDetectionResult | null>;
  detectRoomsFromUrl: (imageUrl: string, options?: RoomDetectionOptions) => Promise<RoomDetectionResult | null>;
  exportAsJSON: () => string | null;
  downloadJSON: () => void;
  clearResults: () => void;
}

export function useRoomBoundaryDetection(): UseRoomBoundaryDetectionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RoomDetectionResult | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

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
    setIsLoading(true);
    
    try {
      // Load OpenCV if not already loaded
      await loadOpenCV();
      
      // Convert image file to OpenCV Mat
      const imageMat = await imageToMat(file);
      
      // Process image
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
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, []);

  return {
    isLoading,
    result,
    canvasRef,
    detectRoomsFromFile,
    detectRoomsFromUrl,
    exportAsJSON,
    downloadJSON,
    clearResults,
  };
}