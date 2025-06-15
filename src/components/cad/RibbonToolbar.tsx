
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Save, 
  FolderOpen, 
  Upload, 
  Download, 
  Plus,
  Square,
  Circle,
  Minus,
  Triangle,
  Box,
  Layers,
  Grid3X3,
  Ruler,
  Move,
  RotateCcw,
  Copy,
  Scissors,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Settings,
  Undo,
  Redo
} from "lucide-react";

interface RibbonToolbarProps {
  onNavigate: (view: string) => void;
  activeTab?: string;
}

export const RibbonToolbar = ({ onNavigate, activeTab = "home" }: RibbonToolbarProps) => {
  return (
    <div className="cad-ribbon h-32 p-2">
      <Tabs value={activeTab} className="w-full h-full">
        <TabsList className="grid w-fit grid-cols-6 bg-secondary/50 h-8 mb-2">
          <TabsTrigger value="home" className="text-xs px-4">Home</TabsTrigger>
          <TabsTrigger value="draw" className="text-xs px-4">Draw</TabsTrigger>
          <TabsTrigger value="modify" className="text-xs px-4">Modify</TabsTrigger>
          <TabsTrigger value="view" className="text-xs px-4">View</TabsTrigger>
          <TabsTrigger value="insert" className="text-xs px-4">Insert</TabsTrigger>
          <TabsTrigger value="output" className="text-xs px-4">Output</TabsTrigger>
        </TabsList>

        <TabsContent value="home" className="h-20 mt-0">
          <div className="flex space-x-6 h-full">
            {/* File Group */}
            <div className="flex flex-col space-y-1">
              <div className="text-xs text-muted-foreground mb-1">File</div>
              <div className="flex space-x-1">
                <Button size="sm" className="cad-button flex-col h-16 w-16 p-1">
                  <FolderOpen className="h-6 w-6 mb-1" />
                  <span className="text-xs">Open</span>
                </Button>
                <Button size="sm" className="cad-button flex-col h-16 w-16 p-1">
                  <Save className="h-6 w-6 mb-1" />
                  <span className="text-xs">Save</span>
                </Button>
                <Button 
                  size="sm" 
                  className="cad-button flex-col h-16 w-16 p-1"
                  onClick={() => onNavigate('upload')}
                >
                  <Upload className="h-6 w-6 mb-1" />
                  <span className="text-xs">Upload</span>
                </Button>
              </div>
            </div>

            {/* Edit Group */}
            <div className="border-l border-border pl-4">
              <div className="text-xs text-muted-foreground mb-1">Edit</div>
              <div className="flex space-x-1">
                <Button size="sm" className="cad-button flex-col h-16 w-12 p-1">
                  <Undo className="h-5 w-5 mb-1" />
                  <span className="text-xs">Undo</span>
                </Button>
                <Button size="sm" className="cad-button flex-col h-16 w-12 p-1">
                  <Redo className="h-5 w-5 mb-1" />
                  <span className="text-xs">Redo</span>
                </Button>
                <Button size="sm" className="cad-button flex-col h-16 w-12 p-1">
                  <Copy className="h-5 w-5 mb-1" />
                  <span className="text-xs">Copy</span>
                </Button>
                <Button size="sm" className="cad-button flex-col h-16 w-12 p-1">
                  <Scissors className="h-5 w-5 mb-1" />
                  <span className="text-xs">Cut</span>
                </Button>
              </div>
            </div>

            {/* Layers Group */}
            <div className="border-l border-border pl-4">
              <div className="text-xs text-muted-foreground mb-1">Layers</div>
              <div className="flex space-x-1">
                <Button size="sm" className="cad-button flex-col h-16 w-16 p-1">
                  <Layers className="h-6 w-6 mb-1" />
                  <span className="text-xs">Manager</span>
                </Button>
                <div className="flex flex-col space-y-1">
                  <Button size="sm" className="cad-button h-7 px-2">
                    <Eye className="h-4 w-4 mr-1" />
                    <span className="text-xs">Show</span>
                  </Button>
                  <Button size="sm" className="cad-button h-7 px-2">
                    <EyeOff className="h-4 w-4 mr-1" />
                    <span className="text-xs">Hide</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="draw" className="h-20 mt-0">
          <div className="flex space-x-6 h-full">
            {/* Basic Shapes */}
            <div className="flex flex-col space-y-1">
              <div className="text-xs text-muted-foreground mb-1">Basic</div>
              <div className="flex space-x-1">
                <Button size="sm" className="cad-button flex-col h-16 w-12 p-1">
                  <Minus className="h-5 w-5 mb-1" />
                  <span className="text-xs">Line</span>
                </Button>
                <Button size="sm" className="cad-button flex-col h-16 w-12 p-1">
                  <Square className="h-5 w-5 mb-1" />
                  <span className="text-xs">Rect</span>
                </Button>
                <Button size="sm" className="cad-button flex-col h-16 w-12 p-1">
                  <Circle className="h-5 w-5 mb-1" />
                  <span className="text-xs">Circle</span>
                </Button>
                <Button size="sm" className="cad-button flex-col h-16 w-12 p-1">
                  <Triangle className="h-5 w-5 mb-1" />
                  <span className="text-xs">Poly</span>
                </Button>
              </div>
            </div>

            {/* 3D Tools */}
            <div className="border-l border-border pl-4">
              <div className="text-xs text-muted-foreground mb-1">3D</div>
              <div className="flex space-x-1">
                <Button size="sm" className="cad-button flex-col h-16 w-16 p-1">
                  <Box className="h-6 w-6 mb-1" />
                  <span className="text-xs">Extrude</span>
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="modify" className="h-20 mt-0">
          <div className="flex space-x-6 h-full">
            {/* Transform Group */}
            <div className="flex flex-col space-y-1">
              <div className="text-xs text-muted-foreground mb-1">Transform</div>
              <div className="flex space-x-1">
                <Button size="sm" className="cad-button flex-col h-16 w-12 p-1">
                  <Move className="h-5 w-5 mb-1" />
                  <span className="text-xs">Move</span>
                </Button>
                <Button size="sm" className="cad-button flex-col h-16 w-12 p-1">
                  <RotateCcw className="h-5 w-5 mb-1" />
                  <span className="text-xs">Rotate</span>
                </Button>
                <Button size="sm" className="cad-button flex-col h-16 w-12 p-1">
                  <Copy className="h-5 w-5 mb-1" />
                  <span className="text-xs">Copy</span>
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="view" className="h-20 mt-0">
          <div className="flex space-x-6 h-full">
            {/* Zoom Group */}
            <div className="flex flex-col space-y-1">
              <div className="text-xs text-muted-foreground mb-1">Zoom</div>
              <div className="flex space-x-1">
                <Button size="sm" className="cad-button flex-col h-16 w-12 p-1">
                  <ZoomIn className="h-5 w-5 mb-1" />
                  <span className="text-xs">In</span>
                </Button>
                <Button size="sm" className="cad-button flex-col h-16 w-12 p-1">
                  <ZoomOut className="h-5 w-5 mb-1" />
                  <span className="text-xs">Out</span>
                </Button>
                <Button size="sm" className="cad-button flex-col h-16 w-12 p-1">
                  <Grid3X3 className="h-5 w-5 mb-1" />
                  <span className="text-xs">Extents</span>
                </Button>
              </div>
            </div>

            {/* 3D View */}
            <div className="border-l border-border pl-4">
              <div className="text-xs text-muted-foreground mb-1">3D Navigation</div>
              <div className="flex space-x-1">
                <Button size="sm" className="cad-button flex-col h-16 w-16 p-1">
                  <RotateCw className="h-6 w-6 mb-1" />
                  <span className="text-xs">Orbit</span>
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="insert" className="h-20 mt-0">
          <div className="flex space-x-6 h-full">
            {/* Files Group */}
            <div className="flex flex-col space-y-1">
              <div className="text-xs text-muted-foreground mb-1">Files</div>
              <div className="flex space-x-1">
                <Button 
                  size="sm" 
                  className="cad-button flex-col h-16 w-20 p-1"
                  onClick={() => onNavigate('upload')}
                >
                  <Upload className="h-6 w-6 mb-1" />
                  <span className="text-xs">Blueprint</span>
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="output" className="h-20 mt-0">
          <div className="flex space-x-6 h-full">
            {/* Export Group */}
            <div className="flex flex-col space-y-1">
              <div className="text-xs text-muted-foreground mb-1">Export</div>
              <div className="flex space-x-1">
                <Button size="sm" className="cad-button flex-col h-16 w-12 p-1">
                  <Download className="h-5 w-5 mb-1" />
                  <span className="text-xs">PDF</span>
                </Button>
                <Button size="sm" className="cad-button flex-col h-16 w-12 p-1">
                  <Download className="h-5 w-5 mb-1" />
                  <span className="text-xs">DWG</span>
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
