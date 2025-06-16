
import { Button } from "@/components/ui/button";
import { 
  Square, 
  Circle as CircleIcon, 
  Minus, 
  Triangle, 
  Move, 
  Grid3X3,
  ZoomIn,
  ZoomOut,
  Save,
  Ruler
} from "lucide-react";
import type { DrawingTool } from "./CADDrawingCanvas";

interface CADToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  showDimensions: boolean;
  onToggleDimensions: () => void;
  onZoom: (factor: number) => void;
  onSave: () => void;
  onClear: () => void;
}

export const CADToolbar = ({
  activeTool,
  onToolChange,
  showGrid,
  onToggleGrid,
  showDimensions,
  onToggleDimensions,
  onZoom,
  onSave,
  onClear
}: CADToolbarProps) => {
  const tools = [
    { name: "Select", tool: "select" as DrawingTool, icon: Move },
    { name: "Line", tool: "line" as DrawingTool, icon: Minus },
    { name: "Rectangle", tool: "rectangle" as DrawingTool, icon: Square },
    { name: "Circle", tool: "circle" as DrawingTool, icon: CircleIcon },
    { name: "Polygon", tool: "polygon" as DrawingTool, icon: Triangle },
  ];

  return (
    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center space-x-2">
        {tools.map((tool) => (
          <Button
            key={tool.tool}
            size="sm"
            variant={activeTool === tool.tool ? "default" : "outline"}
            onClick={() => onToolChange(tool.tool)}
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
          onClick={onToggleGrid}
        >
          <Grid3X3 className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant={showDimensions ? "default" : "outline"}
          onClick={onToggleDimensions}
        >
          <Ruler className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => onZoom(1.2)}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => onZoom(0.8)}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={onSave}>
          <Save className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="destructive" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
};
