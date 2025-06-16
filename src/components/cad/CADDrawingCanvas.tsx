
import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas } from "fabric";
import { CADToolbar } from "./CADToolbar";
import { CADPropertiesPanel } from "./CADPropertiesPanel";
import { useCADCanvas } from "@/hooks/cad/useCADCanvas";
import { useCADTools } from "@/hooks/cad/useCADTools";
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
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [selectedObject, setSelectedObject] = useState<any>(null);

  const { createGrid, snapPoint, calculateDistance } = useCADCanvas(gridSize, showGrid);
  
  const { handleMouseDown, handleMouseMove, handleMouseUp } = useCADTools(
    fabricCanvas,
    activeTool,
    (point) => snapPoint(point, snapToGrid),
    calculateDistance,
    onShapeCreated,
    (measurement) => {
      setMeasurements(prev => [...prev, measurement]);
      onMeasurement?.(measurement);
    },
    showDimensions
  );

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

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

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
  }, [activeTool, snapToGrid, gridSize, showGrid, showDimensions, createGrid, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Update grid when settings change
  useEffect(() => {
    if (fabricCanvas) {
      createGrid(fabricCanvas);
    }
  }, [fabricCanvas, createGrid]);

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
    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1
    });
    const link = document.createElement('a');
    link.download = `cad-drawing-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    toast.success("Drawing saved");
  };

  return (
    <div className="flex flex-col space-y-4">
      <CADToolbar
        activeTool={activeTool}
        onToolChange={handleToolChange}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        showDimensions={showDimensions}
        onToggleDimensions={() => setShowDimensions(!showDimensions)}
        onZoom={handleZoom}
        onSave={handleSave}
        onClear={handleClear}
      />

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="border border-border rounded-lg overflow-hidden shadow-lg">
            <canvas ref={canvasRef} className="max-w-full" />
          </div>
        </div>

        <CADPropertiesPanel
          gridSize={gridSize}
          snapToGrid={snapToGrid}
          selectedObject={selectedObject}
          measurements={measurements}
        />
      </div>
    </div>
  );
};
