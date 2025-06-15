import { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Box, Text } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BIMElementsManager } from "@/components/bim/BIMElementsManager";
import { FEAAnalysisManager } from "@/components/fea/FEAAnalysisManager";
import { GISDataManager } from "@/components/gis/GISDataManager";
import { CADDrawingCanvas } from "./CADDrawingCanvas";
import { CADMeasurementTool } from "./CADMeasurementTool";
import { Enhanced3DViewer } from "@/components/3d/Enhanced3DViewer";
import { FEAResultsOverlay } from "@/components/3d/FEAResultsOverlay";
import { useCADDrawing } from "@/hooks/useCADDrawing";
import { use3DViewer } from "@/hooks/use3DViewer";
import { Layers, Package, Calculator, Zap, Settings, Eye, Grid3X3, Map, PenTool } from "lucide-react";

interface CADCanvasProps {
  onNavigate: (view: string) => void;
}

export const CADCanvas = ({ onNavigate }: CADCanvasProps) => {
  const [activeTab, setActiveTab] = useState("drawing");
  const [showGrid, setShowGrid] = useState(true);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // CAD Drawing hooks
  const {
    shapes,
    measurements,
    selectedShapeId,
    setSelectedShapeId,
    addShape,
    updateShape,
    deleteShape,
    addMeasurement,
    removeMeasurement,
    clearDrawing
  } = useCADDrawing();

  // Enhanced 3D Viewer hooks
  const {
    elements,
    feaResults,
    viewerState,
    selectedElementIndex,
    selectElement,
    toggleFEAOverlay,
    hasElements,
    hasFEAResults,
    isLoading
  } = use3DViewer();

  const handleShapeCreated = (shape: any) => {
    // Convert Fabric.js shape to CAD shape format
    const cadShape = {
      type: shape.type as 'line' | 'rectangle' | 'circle' | 'polygon' | 'arc',
      properties: {
        points: [{ x: shape.left || 0, y: shape.top || 0 }],
        dimensions: {
          width: shape.width,
          height: shape.height,
          radius: shape.radius
        },
        style: {
          stroke: shape.stroke,
          fill: shape.fill,
          strokeWidth: shape.strokeWidth
        }
      }
    };
    addShape(cadShape);
  };

  const handleMeasurementCreated = (measurement: any) => {
    const cadMeasurement = {
      type: 'distance' as const,
      value: parseFloat(measurement.distance),
      unit: 'px',
      points: [measurement.startPoint, measurement.endPoint]
    };
    addMeasurement(cadMeasurement);
  };

  return (
    <div className="flex-1 flex bg-gray-950 overflow-hidden">
      {/* Main Viewport */}
      <div className="flex-1 relative">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "2d" | "3d")} className="absolute top-4 left-4 z-10">
          <TabsList className="bg-gray-800/80 border-cyan-500/30">
            <TabsTrigger value="2d" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              <PenTool className="w-4 h-4 mr-1" />
              2D Drawing
            </TabsTrigger>
            <TabsTrigger value="3d" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              <Package className="w-4 h-4 mr-1" />
              3D Model
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {viewMode === "2d" ? (
          <div className="h-full p-4">
            <CADDrawingCanvas
              onShapeCreated={handleShapeCreated}
              onMeasurement={handleMeasurementCreated}
              gridSize={20}
              snapToGrid={true}
            />
          </div>
        ) : (
          <div className="h-full relative">
            {hasElements ? (
              <>
                <Enhanced3DViewer
                  elements={elements}
                  feaResults={feaResults}
                  onElementSelect={selectElement}
                  onDownload={() => console.log('Download 3D model')}
                />
                
                {/* FEA Results Overlay */}
                {viewerState.feaOverlayEnabled && hasFEAResults && (
                  <FEAResultsOverlay
                    results={feaResults}
                    selectedElementIndex={selectedElementIndex}
                    analysisType={viewerState.feaAnalysisType}
                  />
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <Card className="bg-gray-900/90 border-cyan-500/30">
                  <CardContent className="p-8 text-center">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-200 mb-2">No 3D Model Available</h3>
                    <p className="text-gray-400 mb-4">
                      Upload a blueprint or create BIM elements to view in 3D
                    </p>
                    <Button 
                      onClick={() => onNavigate('upload')}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      Upload Blueprint
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* 3D Viewport Controls */}
        {viewMode === "3d" && hasElements && (
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              size="sm"
              variant={viewerState.feaOverlayEnabled ? "default" : "outline"}
              onClick={() => toggleFEAOverlay()}
              className="bg-gray-800/80 border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/20"
              disabled={!hasFEAResults}
            >
              <Zap className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={showGrid ? "default" : "outline"}
              onClick={() => setShowGrid(!showGrid)}
              className="bg-gray-800/80 border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/20"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-gray-800/80 border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/20"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-gray-800/80 border-cyan-500/30 text-cyan-300 hover:bg-cyan-600/20"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Element Info for 3D mode */}
        {viewMode === "3d" && selectedElement && (
          <Card className="absolute bottom-4 right-4 bg-gray-900/90 border-cyan-500/30 backdrop-blur">
            <CardContent className="p-4">
              <div className="space-y-2">
                <Badge variant="outline" className="text-cyan-300 border-cyan-500">
                  {selectedElement}
                </Badge>
                <p className="text-sm text-gray-300">
                  Selected element: {selectedElement.replace("-", " ").toUpperCase()}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700">
                    <Calculator className="w-3 h-3 mr-1" />
                    Analyze
                  </Button>
                  <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-300">
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Panel */}
      <div className="w-96 border-l border-gray-800 bg-gray-900/95 backdrop-blur flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800 m-2">
            <TabsTrigger 
              value="drawing" 
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
            >
              <PenTool className="w-4 h-4 mr-1" />
              Draw
            </TabsTrigger>
            <TabsTrigger 
              value="model"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
            >
              <Package className="w-4 h-4 mr-1" />
              Model
            </TabsTrigger>
            <TabsTrigger 
              value="analysis"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
            >
              <Calculator className="w-4 h-4 mr-1" />
              FEA
            </TabsTrigger>
            <TabsTrigger 
              value="gis"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
            >
              <Map className="w-4 h-4 mr-1" />
              GIS
            </TabsTrigger>
            <TabsTrigger 
              value="layers"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
            >
              <Layers className="w-4 h-4 mr-1" />
              Layers
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="drawing" className="h-full p-2 overflow-y-auto">
              <CADMeasurementTool
                measurements={measurements}
                onMeasurementAdded={addMeasurement}
                onMeasurementRemoved={removeMeasurement}
              />
              
              <div className="mt-4 space-y-4">
                <h3 className="text-lg font-semibold text-cyan-300">Drawing Objects</h3>
                {shapes.length > 0 ? (
                  <div className="space-y-2">
                    {shapes.map((shape) => (
                      <div
                        key={shape.id}
                        className={`p-2 bg-gray-800 rounded cursor-pointer border ${
                          selectedShapeId === shape.id ? 'border-cyan-500' : 'border-gray-700'
                        }`}
                        onClick={() => setSelectedShapeId(shape.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-200 capitalize">{shape.type}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteShape(shape.id);
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No drawing objects yet</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="model" className="h-full p-2 overflow-y-auto">
              <BIMElementsManager />
            </TabsContent>

            <TabsContent value="analysis" className="h-full p-2 overflow-y-auto">
              <FEAAnalysisManager elementId={selectedElement || undefined} />
            </TabsContent>

            <TabsContent value="gis" className="h-full p-2 overflow-y-auto">
              <GISDataManager />
            </TabsContent>

            <TabsContent value="layers" className="h-full p-2 overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cyan-300">Layer Management</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                    <span className="text-gray-200">Drawing Layer</span>
                    <Badge variant="outline" className="text-emerald-400 border-emerald-400">
                      Visible
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                    <span className="text-gray-200">Structural</span>
                    <Badge variant="outline" className="text-emerald-400 border-emerald-400">
                      Visible
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                    <span className="text-gray-200">Architectural</span>
                    <Badge variant="outline" className="text-emerald-400 border-emerald-400">
                      Visible
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                    <span className="text-gray-200">MEP</span>
                    <Badge variant="outline" className="text-gray-500 border-gray-500">
                      Hidden
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                    <span className="text-gray-200">GIS Data</span>
                    <Badge variant="outline" className="text-emerald-400 border-emerald-400">
                      Visible
                    </Badge>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
