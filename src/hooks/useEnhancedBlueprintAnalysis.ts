import { useState, useCallback, useRef } from 'react';
import { detectRoomsWithDimensions, EnhancedRoomDetectionResult, EnhancedRoomDetectionOptions } from '@/utils/enhancedRoomDetection';
import { extractTextFromBlueprint } from '@/hooks/blueprint/utils/textExtraction';
import { loadOpenCV, imageToMat } from '@/utils/wallDetection';
import { useToast } from '@/components/ui/use-toast';

interface UseEnhancedBlueprintAnalysisReturn {
  isLoading: boolean;
  isOpenCVLoading: boolean;
  openCVLoaded: boolean;
  result: EnhancedRoomDetectionResult | null;
  error: string | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  analyzeFromFile: (file: File, options?: EnhancedRoomDetectionOptions) => Promise<EnhancedRoomDetectionResult | null>;
  analyzeFromUrl: (imageUrl: string, options?: EnhancedRoomDetectionOptions) => Promise<EnhancedRoomDetectionResult | null>;
  exportAsJSON: () => string | null;
  downloadJSON: () => void;
  clearResults: () => void;
  retryOpenCVLoad: () => Promise<void>;
}

export function useEnhancedBlueprintAnalysis(): UseEnhancedBlueprintAnalysisReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpenCVLoading, setIsOpenCVLoading] = useState(false);
  const [openCVLoaded, setOpenCVLoaded] = useState(!!window.cv);
  const [result, setResult] = useState<EnhancedRoomDetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const retryOpenCVLoad = useCallback(async () => {
    if (window.cv) {
      setOpenCVLoaded(true);
      return;
    }

    setIsOpenCVLoading(true);
    setError(null);
    
    try {
      await loadOpenCV();
      setOpenCVLoaded(true);
      toast({
        title: "OpenCV Loaded",
        description: "Computer vision library loaded successfully",
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load OpenCV';
      setError(errorMsg);
      toast({
        title: "OpenCV Loading Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsOpenCVLoading(false);
    }
  }, [toast]);

  const processImage = useCallback(async (
    imageMat: any, 
    imageUrl: string, 
    options: EnhancedRoomDetectionOptions = {}
  ): Promise<EnhancedRoomDetectionResult | null> => {
    try {
      // Step 1: Extract text from blueprint using OCR
      toast({
        title: "Analyzing Blueprint",
        description: "Extracting text and annotations...",
      });

      const ocrResult = await extractTextFromBlueprint(imageUrl);
      
      // Step 2: Detect rooms with dimensions
      toast({
        title: "Detecting Rooms",
        description: "Analyzing room boundaries and calculating dimensions...",
      });

      const detectionResult = detectRoomsWithDimensions(imageMat, ocrResult.text, options);
      
      // Step 3: Visualize results
      if (canvasRef.current) {
        visualizeRoomsWithDimensions(detectionResult, canvasRef.current);
      }

      toast({
        title: "Analysis Complete",
        description: `Found ${detectionResult.totalRooms} rooms with ${detectionResult.summary.bedrooms} bedrooms and ${detectionResult.summary.bathrooms} bathrooms`,
      });

      setResult(detectionResult);
      return detectionResult;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMsg);
      toast({
        title: "Analysis Failed",
        description: errorMsg,
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  const analyzeFromFile = useCallback(async (
    file: File, 
    options: EnhancedRoomDetectionOptions = {}
  ): Promise<EnhancedRoomDetectionResult | null> => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return null;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size too large. Please select an image under 10MB');
      return null;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Load OpenCV if not already loaded
      if (!openCVLoaded) {
        await retryOpenCVLoad();
      }

      if (!openCVLoaded) {
        throw new Error('OpenCV failed to load');
      }

      // Convert image to Mat
      const imageMat = await imageToMat(file);
      const imageUrl = URL.createObjectURL(file);
      
      const result = await processImage(imageMat, imageUrl, options);
      
      // Clean up
      imageMat.delete();
      URL.revokeObjectURL(imageUrl);
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMsg);
      toast({
        title: "Analysis Failed",
        description: errorMsg,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [openCVLoaded, retryOpenCVLoad, processImage, toast]);

  const analyzeFromUrl = useCallback(async (
    imageUrl: string, 
    options: EnhancedRoomDetectionOptions = {}
  ): Promise<EnhancedRoomDetectionResult | null> => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Load OpenCV if not already loaded
      if (!openCVLoaded) {
        await retryOpenCVLoad();
      }

      if (!openCVLoaded) {
        throw new Error('OpenCV failed to load');
      }

      // Fetch image as blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Convert to Mat
      const imageMat = await imageToMat(blob);
      
      const result = await processImage(imageMat, imageUrl, options);
      
      // Clean up
      imageMat.delete();
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMsg);
      toast({
        title: "Analysis Failed",
        description: errorMsg,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [openCVLoaded, retryOpenCVLoad, processImage, toast]);

  const exportAsJSON = useCallback((): string | null => {
    if (!result) return null;
    
    const exportData = {
      metadata: {
        totalRooms: result.totalRooms,
        summary: result.summary,
        scale: result.scale,
        imageSize: result.imageSize,
        processingTime: result.processingTime,
        timestamp: new Date().toISOString()
      },
      rooms: result.rooms.map(room => ({
        id: room.id,
        name: room.name,
        type: room.type,
        dimensions: room.dimensions,
        realWorldDimensions: room.realWorldDimensions,
        confidence: room.confidence,
        bounds: room.bounds
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }, [result]);

  const downloadJSON = useCallback(() => {
    const jsonData = exportAsJSON();
    if (!jsonData) return;

    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `room-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportAsJSON]);

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
    analyzeFromFile,
    analyzeFromUrl,
    exportAsJSON,
    downloadJSON,
    clearResults,
    retryOpenCVLoad
  };
}

/**
 * Visualize rooms with dimensions on canvas
 */
function visualizeRoomsWithDimensions(
  result: EnhancedRoomDetectionResult,
  canvas: HTMLCanvasElement
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set canvas size
  canvas.width = result.imageSize.width;
  canvas.height = result.imageSize.height;

  // Clear canvas
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw room boundaries with labels and dimensions
  result.rooms.forEach((room, index) => {
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

      // Add room label and dimensions
      const centerX = room.bounds.x + room.bounds.width / 2;
      const centerY = room.bounds.y + room.bounds.height / 2;
      
      ctx.fillStyle = 'black';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(room.name, centerX, centerY - 10);
      
      if (room.realWorldDimensions) {
        ctx.font = '10px Arial';
        const dimensionText = `${room.realWorldDimensions.width}' × ${room.realWorldDimensions.length}'`;
        const areaText = `${room.realWorldDimensions.area} sq ${room.realWorldDimensions.units}`;
        ctx.fillText(dimensionText, centerX, centerY + 5);
        ctx.fillText(areaText, centerX, centerY + 18);
      }
    }
  });
}