
import { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, Box, Text } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BIMElementsManager } from "@/components/bim/BIMElementsManager";
import { FEAAnalysisManager } from "@/components/fea/FEAAnalysisManager";
import { Layers, Cube, Calculator, Zap, Settings, Eye, Grid3X3 } from "lucide-react";

interface CADCanvasProps {
  onNavigate: (view: string) => void;
}

export const CADCanvas = ({ onNavigate }: CADCanvasProps) => {
  const [activeTab, setActiveTab] = useState("model");
  const [showGrid, setShowGrid] = useState(true);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div className="flex-1 flex bg-gray-950 overflow-hidden">
      {/* Main 3D Viewport */}
      <div className="flex-1 relative">
        <Canvas
          ref={canvasRef}
          camera={{ position: [10, 10, 10], fov: 60 }}
          className="bg-gradient-to-br from-gray-950 via-blue-950/20 to-cyan-950/20"
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={0.8} color="#00ffff" />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} color="#ff6b35" />
          
          {showGrid && (
            <Grid 
              args={[20, 20]} 
              position={[0, -0.01, 0]}
              cellColor="#00ffff"
              sectionColor="#ff6b35"
              fadeDistance={50}
              fadeStrength={1}
            />
          )}

          {/* Sample 3D Elements */}
          <Box position={[0, 1, 0]} args={[2, 2, 0.2]} onClick={() => setSelectedElement("wall-1")}>
            <meshStandardMaterial 
              color={selectedElement === "wall-1" ? "#00ffff" : "#4a5568"} 
              transparent
              opacity={0.8}
            />
          </Box>
          
          <Box position={[0, 3, 0]} args={[2, 0.2, 0.2]} onClick={() => setSelectedElement("beam-1")}>
            <meshStandardMaterial 
              color={selectedElement === "beam-1" ? "#00ffff" : "#e53e3e"} 
              transparent
              opacity={0.8}
            />
          </Box>

          <OrbitControls 
            enablePan={true} 
            enableZoom={true} 
            enableRotate={true}
            minDistance={2}
            maxDistance={100}
          />
        </Canvas>

        {/* Viewport Controls */}
        <div className="absolute top-4 left-4 flex gap-2">
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

        {/* Element Info */}
        {selectedElement && (
          <Card className="absolute top-4 right-4 bg-gray-900/90 border-cyan-500/30 backdrop-blur">
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
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 m-2">
            <TabsTrigger 
              value="model" 
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
            >
              <Cube className="w-4 h-4 mr-1" />
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
              value="layers"
              className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
            >
              <Layers className="w-4 h-4 mr-1" />
              Layers
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="model" className="h-full p-2 overflow-y-auto">
              <BIMElementsManager />
            </TabsContent>

            <TabsContent value="analysis" className="h-full p-2 overflow-y-auto">
              <FEAAnalysisManager elementId={selectedElement || undefined} />
            </TabsContent>

            <TabsContent value="layers" className="h-full p-2 overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cyan-300">Layer Management</h3>
                <div className="space-y-2">
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
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
