
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface CADShape {
  id: string;
  type: 'line' | 'rectangle' | 'circle' | 'polygon' | 'arc';
  properties: {
    points?: { x: number; y: number }[];
    dimensions?: { width?: number; height?: number; radius?: number };
    style?: { stroke?: string; fill?: string; strokeWidth?: number };
  };
  metadata?: {
    created: Date;
    lastModified: Date;
    parametric?: boolean;
  };
}

export interface CADMeasurement {
  id: string;
  type: 'distance' | 'area' | 'angle';
  value: number;
  unit: string;
  points: { x: number; y: number }[];
  shapeId?: string;
}

export const useCADDrawing = () => {
  const [shapes, setShapes] = useState<CADShape[]>([]);
  const [measurements, setMeasurements] = useState<CADMeasurement[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [drawingHistory, setDrawingHistory] = useState<CADShape[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const addShape = useCallback((shape: Omit<CADShape, 'id' | 'metadata'>) => {
    const newShape: CADShape = {
      ...shape,
      id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        created: new Date(),
        lastModified: new Date(),
        parametric: true
      }
    };

    setShapes(prev => {
      const updated = [...prev, newShape];
      // Add to history
      setDrawingHistory(history => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(updated);
        return newHistory;
      });
      setHistoryIndex(prev => prev + 1);
      return updated;
    });

    toast.success(`${shape.type} added to drawing`);
    return newShape;
  }, [historyIndex]);

  const updateShape = useCallback((id: string, updates: Partial<CADShape>) => {
    setShapes(prev => {
      const updated = prev.map(shape => 
        shape.id === id 
          ? { 
              ...shape, 
              ...updates, 
              metadata: { 
                ...shape.metadata, 
                lastModified: new Date() 
              } 
            }
          : shape
      );

      // Add to history
      setDrawingHistory(history => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(updated);
        return newHistory;
      });
      setHistoryIndex(prev => prev + 1);
      
      return updated;
    });

    toast.success('Shape updated');
  }, [historyIndex]);

  const deleteShape = useCallback((id: string) => {
    setShapes(prev => {
      const updated = prev.filter(shape => shape.id !== id);
      
      // Add to history
      setDrawingHistory(history => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(updated);
        return newHistory;
      });
      setHistoryIndex(prev => prev + 1);
      
      return updated;
    });

    // Remove related measurements
    setMeasurements(prev => prev.filter(m => m.shapeId !== id));
    
    if (selectedShapeId === id) {
      setSelectedShapeId(null);
    }

    toast.success('Shape deleted');
  }, [selectedShapeId, historyIndex]);

  const addMeasurement = useCallback((measurement: Omit<CADMeasurement, 'id'>) => {
    const newMeasurement: CADMeasurement = {
      ...measurement,
      id: `measurement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    setMeasurements(prev => [...prev, newMeasurement]);
    toast.success(`${measurement.type} measurement added`);
    return newMeasurement;
  }, []);

  const removeMeasurement = useCallback((id: string) => {
    setMeasurements(prev => prev.filter(m => m.id !== id));
    toast.success('Measurement removed');
  }, []);

  const clearDrawing = useCallback(() => {
    setShapes([]);
    setMeasurements([]);
    setSelectedShapeId(null);
    setDrawingHistory([[]]);
    setHistoryIndex(0);
    toast.success('Drawing cleared');
  }, []);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setShapes(drawingHistory[historyIndex - 1]);
      toast.success('Undo');
    }
  }, [historyIndex, drawingHistory]);

  const redo = useCallback(() => {
    if (historyIndex < drawingHistory.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setShapes(drawingHistory[historyIndex + 1]);
      toast.success('Redo');
    }
  }, [historyIndex, drawingHistory]);

  const exportDrawing = useCallback(() => {
    const drawingData = {
      shapes,
      measurements,
      metadata: {
        created: new Date(),
        version: '1.0',
        totalShapes: shapes.length,
        totalMeasurements: measurements.length
      }
    };

    const dataStr = JSON.stringify(drawingData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `cad-drawing-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    toast.success('Drawing exported');
  }, [shapes, measurements]);

  const importDrawing = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const drawingData = JSON.parse(e.target?.result as string);
        if (drawingData.shapes && Array.isArray(drawingData.shapes)) {
          setShapes(drawingData.shapes);
          setMeasurements(drawingData.measurements || []);
          setSelectedShapeId(null);
          toast.success('Drawing imported');
        } else {
          throw new Error('Invalid file format');
        }
      } catch (error) {
        toast.error('Failed to import drawing');
      }
    };
    reader.readAsText(file);
  }, []);

  return {
    shapes,
    measurements,
    selectedShapeId,
    setSelectedShapeId,
    addShape,
    updateShape,
    deleteShape,
    addMeasurement,
    removeMeasurement,
    clearDrawing,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < drawingHistory.length - 1,
    exportDrawing,
    importDrawing
  };
};
