
import { useState, useCallback } from 'react';
import { Canvas as FabricCanvas, Circle, Rect, Line, Point, Path } from "fabric";
import type { DrawingTool } from '@/components/cad/CADDrawingCanvas';

export const useCADTools = (
  fabricCanvas: FabricCanvas | null,
  activeTool: DrawingTool,
  snapPoint: (point: Point) => Point,
  calculateDistance: (p1: Point, p2: Point) => number,
  onShapeCreated?: (shape: any) => void,
  onMeasurement?: (measurement: any) => void,
  showDimensions?: boolean
) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentShape, setCurrentShape] = useState<any>(null);
  const [arcPoints, setArcPoints] = useState<Point[]>([]);

  const createArcPath = useCallback((start: Point, middle: Point, end: Point): string => {
    // Calculate arc using SVG path notation
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    // Calculate control point based on middle point
    const controlX = 2 * middle.x - midX;
    const controlY = 2 * middle.y - midY;
    
    return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;
  }, []);

  const handleMouseDown = useCallback((e: any) => {
    if (!fabricCanvas || activeTool === "select") return;

    const pointer = fabricCanvas.getPointer(e.e);
    const snappedPoint = snapPoint(new Point(pointer.x, pointer.y));
    
    setIsDrawing(true);
    setStartPoint(snappedPoint);

    switch (activeTool) {
      case "line":
        const line = new Line([snappedPoint.x, snappedPoint.y, snappedPoint.x, snappedPoint.y], {
          stroke: '#000000',
          strokeWidth: 2,
          selectable: false
        });
        fabricCanvas.add(line);
        setCurrentShape(line);
        break;

      case "rectangle":
        const rect = new Rect({
          left: snappedPoint.x,
          top: snappedPoint.y,
          width: 0,
          height: 0,
          fill: 'transparent',
          stroke: '#000000',
          strokeWidth: 2,
          selectable: false
        });
        fabricCanvas.add(rect);
        setCurrentShape(rect);
        break;

      case "circle":
        const circle = new Circle({
          left: snappedPoint.x,
          top: snappedPoint.y,
          radius: 0,
          fill: 'transparent',
          stroke: '#000000',
          strokeWidth: 2,
          selectable: false
        });
        fabricCanvas.add(circle);
        setCurrentShape(circle);
        break;

      case "arc":
        if (arcPoints.length === 0) {
          // First point - start of arc
          setArcPoints([snappedPoint]);
        } else if (arcPoints.length === 1) {
          // Second point - middle control point
          setArcPoints([...arcPoints, snappedPoint]);
        } else if (arcPoints.length === 2) {
          // Third point - end of arc, create the arc
          const pathString = createArcPath(arcPoints[0], arcPoints[1], snappedPoint);
          const arc = new Path(pathString, {
            stroke: '#000000',
            strokeWidth: 2,
            fill: 'transparent',
            selectable: false
          });
          fabricCanvas.add(arc);
          setCurrentShape(arc);
          setArcPoints([]);
          setIsDrawing(false);
          onShapeCreated?.(arc);
          return;
        }
        break;
    }
  }, [fabricCanvas, activeTool, snapPoint, arcPoints, createArcPath, onShapeCreated]);

  const handleMouseMove = useCallback((e: any) => {
    if (!fabricCanvas || !isDrawing || !startPoint || !currentShape) return;

    const pointer = fabricCanvas.getPointer(e.e);
    const snappedPoint = snapPoint(new Point(pointer.x, pointer.y));

    switch (activeTool) {
      case "line":
        currentShape.set({
          x2: snappedPoint.x,
          y2: snappedPoint.y
        });
        break;

      case "rectangle":
        const width = Math.abs(snappedPoint.x - startPoint.x);
        const height = Math.abs(snappedPoint.y - startPoint.y);
        currentShape.set({
          width,
          height,
          left: Math.min(startPoint.x, snappedPoint.x),
          top: Math.min(startPoint.y, snappedPoint.y)
        });
        break;

      case "circle":
        const radius = calculateDistance(startPoint, snappedPoint);
        currentShape.set({
          radius,
          left: startPoint.x - radius,
          top: startPoint.y - radius
        });
        break;
    }

    fabricCanvas.renderAll();
  }, [fabricCanvas, isDrawing, startPoint, currentShape, activeTool, snapPoint, calculateDistance]);

  const handleMouseUp = useCallback((e: any) => {
    if (!fabricCanvas || !isDrawing || !currentShape) return;

    // Don't finish drawing for arc tool until all 3 points are set
    if (activeTool === "arc" && arcPoints.length < 2) return;

    setIsDrawing(false);
    currentShape.set({ selectable: true });
    
    if (showDimensions && startPoint && activeTool !== "arc") {
      const pointer = fabricCanvas.getPointer(e.e);
      const endPoint = snapPoint(new Point(pointer.x, pointer.y));
      const distance = calculateDistance(startPoint, endPoint);
      
      const measurement = {
        id: Date.now(),
        type: activeTool,
        distance: distance.toFixed(2),
        startPoint,
        endPoint,
        shape: currentShape
      };
      
      onMeasurement?.(measurement);
    }

    if (activeTool !== "arc") {
      onShapeCreated?.(currentShape);
    }
    
    setCurrentShape(null);
    setStartPoint(null);
  }, [fabricCanvas, isDrawing, currentShape, showDimensions, startPoint, activeTool, snapPoint, calculateDistance, onMeasurement, onShapeCreated, arcPoints.length]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isDrawing,
    arcPoints,
  };
};
