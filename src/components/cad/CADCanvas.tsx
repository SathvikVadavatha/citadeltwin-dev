
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Grid3X3,
  MousePointer,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move3D,
  Maximize,
  Settings
} from "lucide-react";

interface CADCanvasProps {
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export const CADCanvas = ({ currentView = "model", onNavigate }: CADCanvasProps) => {
  const [isGridVisible, setIsGridVisible] = useState(true);
  const [zoom, setZoom] = useState(100);
  const canvasRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Canvas Tabs */}
      <div className="flex items-center justify-between border-b border-border bg-secondary/20 px-2 py-1">
        <Tabs value={currentView} className="flex-1">
          <TabsList className="h-7 bg-transparent p-0 space-x-1">
            <TabsTrigger value="model" className="h-6 px-3 text-xs">Model</TabsTrigger>
            <TabsTrigger value="layout1" className="h-6 px-3 text-xs">Layout1</TabsTrigger>
            <TabsTrigger value="layout2" className="h-6 px-3 text-xs">Layout2</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* View Controls */}
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => setIsGridVisible(!isGridVisible)}
          >
            <Grid3X3 className={`h-3 w-3 ${isGridVisible ? 'text-accent' : 'text-muted-foreground'}`} />
          </Button>
          
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => setZoom(Math.max(10, zoom - 10))}
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Badge variant="outline" className="text-xs px-2 h-6 font-mono">
              {zoom}%
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => setZoom(Math.min(500, zoom + 10))}
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={canvasRef}
          className={`cad-canvas w-full h-full relative cursor-crosshair ${
            isGridVisible ? 'cad-grid' : ''
          }`}
        >
          {/* Canvas Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                <MousePointer className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium mb-2">CAD Drawing Canvas</h3>
              <p className="text-sm max-w-md">
                Use the ribbon tools to start drawing or upload a blueprint to begin your project.
                Click and drag to pan, scroll to zoom.
              </p>
              {onNavigate && (
                <Button 
                  className="mt-4" 
                  onClick={() => onNavigate('upload')}
                >
                  Upload Blueprint
                </Button>
              )}
            </div>
          </div>

          {/* Origin Indicator */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-4 relative">
              <div className="absolute w-8 h-0.5 bg-red-500 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute w-0.5 h-8 bg-green-500 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
          </div>

          {/* View Cube (3D Navigation) */}
          <div className="absolute top-4 right-4 w-16 h-16 bg-card border border-border rounded-lg shadow-lg">
            <div className="w-full h-full flex items-center justify-center text-xs font-medium text-foreground cursor-pointer hover:bg-secondary/50 transition-colors rounded-lg">
              <div className="text-center">
                <RotateCw className="h-6 w-6 mx-auto mb-1" />
                <div>TOP</div>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
            <Button size="sm" className="cad-button w-10 h-10 p-0">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="sm" className="cad-button w-10 h-10 p-0">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="sm" className="cad-button w-10 h-10 p-0">
              <Maximize className="h-4 w-4" />
            </Button>
            <Button size="sm" className="cad-button w-10 h-10 p-0">
              <Move3D className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
