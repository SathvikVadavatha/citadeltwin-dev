
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
  Settings,
  Layers
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
      <div className="flex items-center justify-between cyber-ribbon px-2 py-1">
        <Tabs value={currentView} className="flex-1">
          <TabsList className="h-7 bg-transparent p-0 space-x-1">
            <TabsTrigger value="model" className="h-6 px-3 text-xs cyber-button">Model</TabsTrigger>
            <TabsTrigger value="layout1" className="h-6 px-3 text-xs cyber-button">Layout1</TabsTrigger>
            <TabsTrigger value="layout2" className="h-6 px-3 text-xs cyber-button">Layout2</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* View Controls */}
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 cyber-button"
            onClick={() => setIsGridVisible(!isGridVisible)}
          >
            <Grid3X3 className={`h-3 w-3 ${isGridVisible ? 'text-primary glow-cyan' : 'text-muted-foreground'}`} />
          </Button>
          
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 cyber-button"
              onClick={() => setZoom(Math.max(10, zoom - 10))}
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Badge variant="outline" className="text-xs px-2 h-6 font-mono gradient-border">
              {zoom}%
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 cyber-button"
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
          className={`cyber-canvas w-full h-full relative cursor-crosshair ${
            isGridVisible ? 'cyber-grid' : ''
          }`}
          style={{
            backgroundImage: isGridVisible ? 
              'radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 0, 255, 0.1) 0%, transparent 50%)' : 
              'none'
          }}
        >
          {/* Canvas Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center glow-cyan">
                <Layers className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-foreground glow-cyan">Parametric BIM Canvas</h3>
              <p className="text-sm max-w-md">
                Create and manipulate parametric building elements in real-time.
                Use the BIM tools to start modeling or upload a blueprint to begin.
              </p>
              {onNavigate && (
                <div className="mt-4 space-x-2">
                  <Button 
                    className="cyber-button bg-primary text-primary-foreground glow-cyan" 
                    onClick={() => onNavigate('upload')}
                  >
                    Upload Blueprint
                  </Button>
                  <Button 
                    className="cyber-button" 
                    onClick={() => onNavigate('bim')}
                  >
                    <Layers className="w-4 h-4 mr-2" />
                    BIM Manager
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Origin Indicator */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-4 relative">
              <div className="absolute w-8 h-0.5 bg-red-500 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 glow-magenta"></div>
              <div className="absolute w-0.5 h-8 bg-green-500 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 glow-green"></div>
              <div className="absolute w-2 h-2 border border-primary rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 glow-cyan"></div>
            </div>
          </div>

          {/* View Cube (3D Navigation) */}
          <div className="absolute top-4 right-4 w-16 h-16 cyber-tool-palette rounded-lg shadow-lg glow-cyan">
            <div className="w-full h-full flex items-center justify-center text-xs font-medium text-foreground cursor-pointer hover:bg-secondary/50 transition-colors rounded-lg">
              <div className="text-center">
                <RotateCw className="h-6 w-6 mx-auto mb-1 text-primary" />
                <div className="text-primary">TOP</div>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
            <Button size="sm" className="cyber-button w-10 h-10 p-0 glow-cyan">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button size="sm" className="cyber-button w-10 h-10 p-0 glow-cyan">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="sm" className="cyber-button w-10 h-10 p-0 glow-cyan">
              <Maximize className="h-4 w-4" />
            </Button>
            <Button size="sm" className="cyber-button w-10 h-10 p-0 glow-cyan">
              <Move3D className="h-4 w-4" />
            </Button>
          </div>

          {/* Floating HUD */}
          <div className="absolute top-4 left-4 space-y-2">
            <div className="cyber-tool-palette p-2 rounded-lg glow-cyan">
              <div className="text-xs text-muted-foreground mb-1">Viewport</div>
              <div className="text-sm font-medium text-primary">3D Perspective</div>
            </div>
            <div className="cyber-tool-palette p-2 rounded-lg glow-cyan">
              <div className="text-xs text-muted-foreground mb-1">Elements</div>
              <div className="text-sm font-medium text-primary">0 selected</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
