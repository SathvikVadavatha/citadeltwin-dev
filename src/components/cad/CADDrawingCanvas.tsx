
import { useEffect, useRef, useState, useCallback } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Line, Polygon, Point } from "fabric";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Square, 
  Circle as CircleIcon, 
  Minus, 
  Triangle, 
  Move, 
  Ruler,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save
} from "lucide-react";
import { toast } from "sonner";

export type DrawingTool = "select" | "line" | "rectangle" | "circle" | "polygon" | "arc";

interface CADDrawingCanvasProps {
  onShapeCreated?: (shape: any) => void;
  onMeasurement?: (measurement: any) => void;
  gridSize?: number;
  snapToGrid?: boolean;
}

export const CADDrawingCanvas = ({ 
  onShapeCreated, 
  onMeasurement,
  gridSize = 20,
  snapToGrid = true 
}: CADDrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<DrawingTool>("select");
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentShape, setCurrentShape] = useState<any>(null);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [selectedObject, setSelectedObject] = useState<any>(null);

  // Snap point to grid
  const snapPoint = useCallback((point: Point): Point => {
    if (!snapToGrid) return point;
    return new Point(
      Math.round(point.x / gridSize) * gridSize,
      Math.round(point.y / gridSize) * gridSize
    );
  }, [snapToGrid, gridSize]);

  // Calculate distance between two points
  const calculateDistance = useCallback((p1: Point, p2: Point): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }, []);

  // Create grid pattern
  const createGrid = useCallback((canvas: FabricCanvas) => {
    if (!showGrid) return;

    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();

    // Remove existing grid
    const existingGrid = canvas.getObjects().filter(obj => obj.name === 'grid');
    existingGrid.forEach(obj => canvas.remove(obj));

    // Create vertical lines
    for (let i = 0; i <= canvasWidth; i += gridSize) {
      const line = new Line([i, 0, i, canvasHeight], {
        stroke: '#e0e0e0',
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
        name: 'grid'
      });
      canvas.add(line);
      canvas.sendToBack(line);
    }

    // Create horizontal lines
    for (let i = 0; i <= canvasHeight; i += gridSize) {
      const line = new Line([0, i, canvasWidth, i], {
        stroke: '#e0e0e0',
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
        name: 'grid'
      });
      canvas.add(line);
      canvas.sendToBack(line);
    }

    canvas.renderAll();
  }, [showGrid, gridSize]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
      selection: activeTool === "select"
    });

    setFabricCanvas(canvas);
    createGrid(canvas);

    // Mouse event handlers
    const handleMouseDown = (e: any) => {
      if (activeTool === "select") return;

      const pointer = canvas.getPointer(e.e);
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
          canvas.add(line);
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
          canvas.add(rect);
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
          canvas.add(circle);
          setCurrentShape(circle);
          break;
      }
    };

    const handleMouseMove = (e: any) => {
      if (!isDrawing || !startPoint || !currentShape) return;

      const pointer = canvas.getPointer(e.e);
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

      canvas.renderAll();
    };

    const handleMouseUp = (e: any) => {
      if (!isDrawing || !currentShape) return;

      setIsDrawing(false);
      currentShape.set({ selectable: true });
      
      // Add measurement data
      if (showDimensions && startPoint) {
        const pointer = canvas.getPointer(e.e);
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
        
        setMeasurements(prev => [...prev, measurement]);
        onMeasurement?.(measurement);
      }

      onShapeCreated?.(currentShape);
      setCurrentShape(null);
      setStartPoint(null);
      
      toast.success(`${activeTool} created successfully`);
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    // Selection events
    canvas.on('selection:created', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    return () => {
      canvas.dispose();
    };
  }, [activeTool, snapToGrid, gridSize, showGrid, showDimensions]);

  // Update grid when settings change
  useEffect(() => {
    if (fabricCanvas) {
      createGrid(fabricCanvas);
    }
  }, [fabricCanvas, createGrid]);

  // Tool handlers
  const handleToolChange = (tool: DrawingTool) => {
    setActiveTool(tool);
    if (fabricCanvas) {
      fabricCanvas.selection = tool === "select";
      fabricCanvas.defaultCursor = tool === "select" ? "default" : "crosshair";
    }
  };

  const handleZoom = (factor: number) => {
    if (!fabricCanvas) return;
    const zoom = fabricCanvas.getZoom() * factor;
    fabricCanvas.setZoom(Math.max(0.1, Math.min(5, zoom)));
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    setMeasurements([]);
    createGrid(fabricCanvas);
    toast.success("Canvas cleared");
  };

  const handleSave = () => {
    if (!fabricCanvas) return;
    const dataURL = fabricCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `cad-drawing-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    toast.success("Drawing saved");
  };

  const tools = [
    { name: "Select", tool: "select" as DrawingTool, icon: Move },
    { name: "Line", tool: "line" as DrawingTool, icon: Minus },
    { name: "Rectangle", tool: "rectangle" as DrawingTool, icon: Square },
    { name: "Circle", tool: "circle" as DrawingTool, icon: CircleIcon },
    { name: "Polygon", tool: "polygon" as DrawingTool, icon: Triangle },
  ];

  return (
    <div className="flex flex-col space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
        <div className="flex items-center space-x-2">
          {tools.map((tool) => (
            <Button
              key={tool.tool}
              size="sm"
              variant={activeTool === tool.tool ? "default" : "outline"}
              onClick={() => handleToolChange(tool.tool)}
              className="flex items-center space-x-1"
            >
              <tool.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tool.name}</span>
            </Button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant={showGrid ? "default" : "outline"}
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={showDimensions ? "default" : "outline"}
            onClick={() => setShowDimensions(!showDimensions)}
          >
            <Ruler className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleZoom(1.2)}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleZoom(0.8)}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleSave}>
            <Save className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={handleClear}>
            Clear
          </Button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="border border-border rounded-lg overflow-hidden shadow-lg">
            <canvas ref={canvasRef} className="max-w-full" />
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-80 space-y-4">
          {/* Grid Settings */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">Grid Settings</h3>
              <div className="space-y-2">
                <Label htmlFor="gridSize">Grid Size</Label>
                <Input
                  id="gridSize"
                  type="number"
                  value={gridSize}
                  onChange={(e) => {
                    // Grid size is controlled by parent component
                  }}
                  min="5"
                  max="50"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="snapToGrid"
                  checked={snapToGrid}
                  onChange={() => {
                    // Snap to grid is controlled by parent component
                  }}
                />
                <Label htmlFor="snapToGrid">Snap to Grid</Label>
              </div>
            </CardContent>
          </Card>

          {/* Selected Object Properties */}
          {selectedObject && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold">Object Properties</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <Badge variant="outline">{selectedObject.type}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>X:</span>
                    <span>{selectedObject.left?.toFixed(2) || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Y:</span>
                    <span>{selectedObject.top?.toFixed(2) || 0}</span>
                  </div>
                  {selectedObject.width && (
                    <div className="flex justify-between">
                      <span>Width:</span>
                      <span>{selectedObject.width.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedObject.height && (
                    <div className="flex justify-between">
                      <span>Height:</span>
                      <span>{selectedObject.height.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedObject.radius && (
                    <div className="flex justify-between">
                      <span>Radius:</span>
                      <span>{selectedObject.radius.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Measurements */}
          {measurements.length > 0 && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold">Measurements</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {measurements.map((measurement) => (
                    <div key={measurement.id} className="flex justify-between text-sm">
                      <span>{measurement.type}:</span>
                      <span>{measurement.distance} px</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
