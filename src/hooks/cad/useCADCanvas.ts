
import { useCallback } from 'react';
import { Canvas as FabricCanvas, Line, Point } from "fabric";

export const useCADCanvas = (gridSize: number, showGrid: boolean) => {
  
  const createGrid = useCallback((canvas: FabricCanvas) => {
    if (!showGrid) return;

    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();

    // Remove existing grid lines
    const existingGrid = canvas.getObjects().filter(obj => (obj as any).isGrid === true);
    existingGrid.forEach(obj => canvas.remove(obj));

    // Create vertical lines
    for (let i = 0; i <= canvasWidth; i += gridSize) {
      const line = new Line([i, 0, i, canvasHeight], {
        stroke: '#e0e0e0',
        strokeWidth: 0.5,
        selectable: false,
        evented: false
      });
      (line as any).isGrid = true;
      canvas.add(line);
      canvas.sendObjectToBack(line);
    }

    // Create horizontal lines
    for (let i = 0; i <= canvasHeight; i += gridSize) {
      const line = new Line([0, i, canvasWidth, i], {
        stroke: '#e0e0e0',
        strokeWidth: 0.5,
        selectable: false,
        evented: false
      });
      (line as any).isGrid = true;
      canvas.add(line);
      canvas.sendObjectToBack(line);
    }

    canvas.renderAll();
  }, [showGrid, gridSize]);

  const snapPoint = useCallback((point: Point, snapToGrid: boolean): Point => {
    if (!snapToGrid) return point;
    return new Point(
      Math.round(point.x / gridSize) * gridSize,
      Math.round(point.y / gridSize) * gridSize
    );
  }, [gridSize]);

  const calculateDistance = useCallback((p1: Point, p2: Point): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }, []);

  return {
    createGrid,
    snapPoint,
    calculateDistance,
  };
};
