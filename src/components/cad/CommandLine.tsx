
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface CommandLineProps {
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const CommandLine = ({ isExpanded = false, onToggle }: CommandLineProps) => {
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<string[]>([
    "Welcome to CitadelTwin Parametric BIM - Advanced Digital Twin Platform",
    "Type 'help' for available commands or 'bim' for BIM operations",
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && command.trim()) {
      const newHistory = [...history, `Command: ${command}`];
      
      // Process BIM and CAD commands
      const cmd = command.toLowerCase().trim();
      if (cmd === "help") {
        newHistory.push("Available commands:");
        newHistory.push("BIM: element, material, constraint, assembly");
        newHistory.push("CAD: line, circle, rectangle, move, copy, rotate, erase");
        newHistory.push("VIEW: zoom, pan, orbit, perspective, orthographic");
        newHistory.push("ANALYSIS: analyze, simulate, validate");
      } else if (cmd === "bim") {
        newHistory.push("BIM Mode activated. Available operations:");
        newHistory.push("- CREATE ELEMENT [type] [name]");
        newHistory.push("- LIST ELEMENTS");
        newHistory.push("- MODIFY ELEMENT [id]");
      } else if (cmd === "element") {
        newHistory.push("Element operations: create, list, modify, delete, select");
      } else if (cmd === "material") {
        newHistory.push("Material operations: create, assign, properties, library");
      } else if (cmd === "constraint") {
        newHistory.push("Constraint operations: add, remove, validate, solve");
      } else if (cmd === "analyze") {
        newHistory.push("Starting structural analysis...");
        newHistory.push("FEA engine: Ready for parametric validation");
      } else if (cmd === "line" || cmd === "l") {
        newHistory.push("LINE: Specify first point or [parametric/constraint]:");
      } else if (cmd === "circle" || cmd === "c") {
        newHistory.push("CIRCLE: Specify center point or [radius/diameter]:");
      } else if (cmd === "rectangle" || cmd === "rec") {
        newHistory.push("RECTANGLE: Specify first corner or [dimensions]:");
      } else if (cmd === "zoom" || cmd === "z") {
        newHistory.push("ZOOM: [All/Center/Dynamic/Extents/Previous/Scale/Window/Object]:");
      } else if (cmd.startsWith("create element")) {
        newHistory.push("Creating new BIM element...");
        newHistory.push("Use BIM Manager for detailed element creation");
      } else {
        newHistory.push(`Processing: ${command}`);
        newHistory.push("Command executed in parametric BIM context");
      }
      
      setHistory(newHistory);
      setCommand("");
    }
  };

  const coordinates = { x: 0.000, y: 0.000, z: 0.000 };

  return (
    <div className={`cyber-command-line border-t ${isExpanded ? 'h-48' : 'h-24'} transition-all duration-200`}>
      <div className="flex items-center justify-between p-2 bg-secondary/50 border-b border-border">
        <div className="flex items-center space-x-4 text-xs">
          <Badge variant="outline" className="font-mono gradient-border glow-cyan">
            X: {coordinates.x.toFixed(3)}
          </Badge>
          <Badge variant="outline" className="font-mono gradient-border glow-cyan">
            Y: {coordinates.y.toFixed(3)}
          </Badge>
          <Badge variant="outline" className="font-mono gradient-border glow-cyan">
            Z: {coordinates.z.toFixed(3)}
          </Badge>
          <span className="text-primary glow-cyan">BIM</span>
          <span className="text-primary glow-cyan">SNAP</span>
          <span className="text-primary glow-cyan">GRID</span>
          <span className="text-primary glow-cyan">ORTHO</span>
          <span className="text-accent glow-magenta">PARAMETRIC</span>
        </div>
        
        <button
          onClick={onToggle}
          className="text-xs text-primary hover:text-primary/80 transition-colors glow-cyan"
        >
          {isExpanded ? "▼" : "▲"}
        </button>
      </div>

      {isExpanded && (
        <ScrollArea className="h-32 p-2" ref={scrollRef}>
          <div className="space-y-1 text-xs font-mono">
            {history.map((line, index) => (
              <div
                key={index}
                className={
                  line.startsWith("Command:") 
                    ? "text-accent glow-magenta" 
                    : line.includes("BIM") || line.includes("parametric")
                    ? "text-primary glow-cyan"
                    : "text-foreground"
                }
              >
                {line}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <div className="p-2 border-t border-border">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-primary min-w-fit glow-cyan">Command:</span>
          <Input
            ref={inputRef}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleCommand}
            placeholder="Enter BIM/CAD command..."
            className="h-6 text-xs font-mono bg-background border-primary/50 focus:border-primary glow-cyan"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};
