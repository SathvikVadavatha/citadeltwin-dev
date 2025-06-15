
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
    "Welcome to CitadelTwin CAD - AutoCAD Compatible Interface",
    "Type 'help' for available commands",
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
      
      // Process common AutoCAD commands
      const cmd = command.toLowerCase().trim();
      if (cmd === "help") {
        newHistory.push("Available commands: LINE, CIRCLE, RECTANGLE, MOVE, COPY, ROTATE, ERASE, ZOOM, PAN");
      } else if (cmd === "line" || cmd === "l") {
        newHistory.push("LINE: Specify first point:");
      } else if (cmd === "circle" || cmd === "c") {
        newHistory.push("CIRCLE: Specify center point:");
      } else if (cmd === "rectangle" || cmd === "rec") {
        newHistory.push("RECTANGLE: Specify first corner:");
      } else if (cmd === "zoom" || cmd === "z") {
        newHistory.push("ZOOM: Enter an option [All/Center/Dynamic/Extents/Previous/Scale/Window/Object]:");
      } else {
        newHistory.push(`Unknown command: ${command}`);
      }
      
      setHistory(newHistory);
      setCommand("");
    }
  };

  const coordinates = { x: 0.000, y: 0.000, z: 0.000 };

  return (
    <div className={`cad-command-line border-t border-border ${isExpanded ? 'h-48' : 'h-24'} transition-all duration-200`}>
      <div className="flex items-center justify-between p-2 bg-secondary/50">
        <div className="flex items-center space-x-4 text-xs">
          <Badge variant="outline" className="font-mono">
            X: {coordinates.x.toFixed(3)}
          </Badge>
          <Badge variant="outline" className="font-mono">
            Y: {coordinates.y.toFixed(3)}
          </Badge>
          <Badge variant="outline" className="font-mono">
            Z: {coordinates.z.toFixed(3)}
          </Badge>
          <span className="text-muted-foreground">MODEL</span>
          <span className="text-muted-foreground">SNAP</span>
          <span className="text-muted-foreground">GRID</span>
          <span className="text-muted-foreground">ORTHO</span>
        </div>
        
        <button
          onClick={onToggle}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
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
                className={line.startsWith("Command:") ? "text-accent" : "text-foreground"}
              >
                {line}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <div className="p-2 border-t border-border">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground min-w-fit">Command:</span>
          <Input
            ref={inputRef}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleCommand}
            placeholder="Enter command..."
            className="h-6 text-xs font-mono bg-background border-border focus:border-primary"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};
