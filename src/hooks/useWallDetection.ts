import { useState, useCallback } from 'react';
import { detectWalls, loadOpenCV, imageToMat } from '@/utils/wallDetection';
import { useToast } from '@/components/ui/use-toast';

interface WallDetectionResult {
  walls: number[][];
}

interface UseWallDetectionReturn {
  isLoading: boolean;
  detectWallsFromFile: (file: File) => Promise<WallDetectionResult | null>;
  detectWallsFromUrl: (imageUrl: string) => Promise<WallDetectionResult | null>;
}

export function useWallDetection(): UseWallDetectionReturn {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const detectWallsFromFile = useCallback(async (file: File): Promise<WallDetectionResult | null> => {
    setIsLoading(true);
    
    try {
      // Load OpenCV if not already loaded
      await loadOpenCV();
      
      // Convert image file to OpenCV Mat
      const imageMat = await imageToMat(file);
      
      // Detect walls
      const result = detectWalls(imageMat);
      
      // Clean up
      imageMat.delete();
      
      toast({
        title: "Wall Detection Complete",
        description: `Detected ${result.walls.length} wall segments`,
      });
      
      return result;
    } catch (error) {
      console.error('Wall detection error:', error);
      toast({
        title: "Wall Detection Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const detectWallsFromUrl = useCallback(async (imageUrl: string): Promise<WallDetectionResult | null> => {
    setIsLoading(true);
    
    try {
      // Load OpenCV if not already loaded
      await loadOpenCV();
      
      // Fetch image as blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Convert to Mat and detect walls
      const imageMat = await imageToMat(blob);
      const result = detectWalls(imageMat);
      
      // Clean up
      imageMat.delete();
      
      toast({
        title: "Wall Detection Complete",
        description: `Detected ${result.walls.length} wall segments`,
      });
      
      return result;
    } catch (error) {
      console.error('Wall detection error:', error);
      toast({
        title: "Wall Detection Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    isLoading,
    detectWallsFromFile,
    detectWallsFromUrl,
  };
}