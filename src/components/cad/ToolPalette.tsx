
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Layers,
  Settings,
  Square,
  Circle,
  Minus,
  Triangle,
  Box,
  Move,
  RotateCcw,
  Copy,
  Ruler,
  Grid3X3,
  Eye,
  EyeOff,
  Trash2,
  Plus
} from "lucide-react";

interface ToolPaletteProps {
  isCollapsed?: boolean;
}

export const ToolPalette = ({ isCollapsed = false }: ToolPaletteProps) => {
  const drawingTools = [
    { name: "Line", icon: Minus, shortcut: "L" },
    { name: "Rectangle", icon: Square, shortcut: "REC" },
    { name: "Circle", icon: Circle, shortcut: "C" },
    { name: "Polygon", icon: Triangle, shortcut: "POL" },
    { name: "3D Box", icon: Box, shortcut: "BOX" },
  ];

  const modifyTools = [
    { name: "Move", icon: Move, shortcut: "M" },
    { name: "Rotate", icon: RotateCcw, shortcut: "RO" },
    { name: "Copy", icon: Copy, shortcut: "CP" },
    { name: "Delete", icon: Trash2, shortcut: "DEL" },
  ];

  const layers = [
    { name: "Architecture", visible: true, color: "blue" },
    { name: "Structure", visible: true, color: "red" },
    { name: "MEP", visible: false, color: "green" },
    { name: "Annotations", visible: true, color: "yellow" },
  ];

  if (isCollapsed) {
    return (
      <div className="cad-tool-palette w-12 h-full flex flex-col p-2 space-y-2">
        <Button size="sm" className="cad-button w-8 h-8 p-0">
          <Layers className="h-4 w-4" />
        </Button>
        <Button size="sm" className="cad-button w-8 h-8 p-0">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="cad-tool-palette w-64 h-full flex flex-col">
      {/* Tool Palette Header */}
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-medium text-foreground">Tool Palettes</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-6">
          {/* Drawing Tools */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              Drawing Tools
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {drawingTools.map((tool, index) => (
                <Button
                  key={index}
                  size="sm"
                  className="cad-button flex-col h-16 p-2"
                >
                  <tool.icon className="h-5 w-5 mb-1" />
                  <span className="text-xs">{tool.name}</span>
                  <Badge variant="outline" className="text-xs mt-1 px-1 py-0">
                    {tool.shortcut}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Modify Tools */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              Modify Tools
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {modifyTools.map((tool, index) => (
                <Button
                  key={index}
                  size="sm"
                  className="cad-button flex-col h-16 p-2"
                >
                  <tool.icon className="h-5 w-5 mb-1" />
                  <span className="text-xs">{tool.name}</span>
                  <Badge variant="outline" className="text-xs mt-1 px-1 py-0">
                    {tool.shortcut}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Layer Manager */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Layers
              </h4>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2">
              {layers.map((layer, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-2 rounded bg-secondary/50 hover:bg-secondary/70 transition-colors"
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0"
                  >
                    {layer.visible ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3 opacity-50" />
                    )}
                  </Button>
                  <div
                    className={`w-3 h-3 rounded-full bg-${layer.color}-500`}
                  ></div>
                  <span className="text-xs flex-1 truncate">{layer.name}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Properties Panel */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              Properties
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">X:</span>
                <span className="font-mono">0.000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Y:</span>
                <span className="font-mono">0.000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Length:</span>
                <span className="font-mono">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Angle:</span>
                <span className="font-mono">--</span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
