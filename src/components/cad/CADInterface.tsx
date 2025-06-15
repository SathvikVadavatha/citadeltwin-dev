
import { useState } from "react";
import { RibbonToolbar } from "./RibbonToolbar";
import { ToolPalette } from "./ToolPalette";
import { CADCanvas } from "./CADCanvas";
import { CommandLine } from "./CommandLine";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CADInterfaceProps {
  onNavigate: (view: string) => void;
}

export const CADInterface = ({ onNavigate }: CADInterfaceProps) => {
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const [isCommandExpanded, setIsCommandExpanded] = useState(false);
  const [activeRibbonTab, setActiveRibbonTab] = useState("home");

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      {/* Ribbon Toolbar */}
      <RibbonToolbar onNavigate={onNavigate} activeTab={activeRibbonTab} />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tool Palette */}
        <div className="relative border-r border-border">
          <ToolPalette isCollapsed={isPaletteCollapsed} />
          
          {/* Palette Toggle */}
          <Button
            size="sm"
            variant="ghost"
            className="absolute -right-3 top-4 h-6 w-6 p-0 bg-card border border-border rounded-full shadow-sm z-10"
            onClick={() => setIsPaletteCollapsed(!isPaletteCollapsed)}
          >
            {isPaletteCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </Button>
        </div>

        {/* Canvas Area */}
        <CADCanvas onNavigate={onNavigate} />
      </div>

      {/* Command Line */}
      <CommandLine 
        isExpanded={isCommandExpanded}
        onToggle={() => setIsCommandExpanded(!isCommandExpanded)}
      />
    </div>
  );
};
