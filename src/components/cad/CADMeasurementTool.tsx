
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ruler, Calculator, Move3D } from "lucide-react";

interface Measurement {
  id: string;
  type: "distance" | "area" | "angle";
  value: number;
  unit: string;
  points: { x: number; y: number }[];
  label?: string;
}

interface CADMeasurementToolProps {
  measurements: Measurement[];
  onMeasurementAdded: (measurement: Measurement) => void;
  onMeasurementRemoved: (id: string) => void;
}

export const CADMeasurementTool = ({
  measurements,
  onMeasurementAdded,
  onMeasurementRemoved
}: CADMeasurementToolProps) => {
  const [activeMeasurementType, setActiveMeasurementType] = useState<"distance" | "area" | "angle" | null>(null);

  const calculateDistance = useCallback((p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }, []);

  const calculateArea = useCallback((points: { x: number; y: number }[]): number => {
    if (points.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }, []);

  const calculateAngle = useCallback((p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }): number => {
    const angle1 = Math.atan2(p1.y - p2.y, p1.x - p2.x);
    const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
    let angle = Math.abs(angle1 - angle2) * 180 / Math.PI;
    return angle > 180 ? 360 - angle : angle;
  }, []);

  const formatValue = (measurement: Measurement): string => {
    switch (measurement.type) {
      case "distance":
        return `${measurement.value.toFixed(2)} ${measurement.unit}`;
      case "area":
        return `${measurement.value.toFixed(2)} ${measurement.unit}²`;
      case "angle":
        return `${measurement.value.toFixed(1)}°`;
      default:
        return measurement.value.toFixed(2);
    }
  };

  const getMeasurementIcon = (type: string) => {
    switch (type) {
      case "distance": return Ruler;
      case "area": return Calculator;
      case "angle": return Move3D;
      default: return Ruler;
    }
  };

  const getMeasurementColor = (type: string) => {
    switch (type) {
      case "distance": return "bg-blue-500/20 text-blue-600 border-blue-600/50";
      case "area": return "bg-green-500/20 text-green-600 border-green-600/50";
      case "angle": return "bg-purple-500/20 text-purple-600 border-purple-600/50";
      default: return "bg-gray-500/20 text-muted-foreground border-gray-400/50";
    }
  };

  return (
    <Card className="gradient-border">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Measurement Tools</h3>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant={activeMeasurementType === "distance" ? "default" : "outline"}
              onClick={() => setActiveMeasurementType(activeMeasurementType === "distance" ? null : "distance")}
            >
              <Ruler className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={activeMeasurementType === "area" ? "default" : "outline"}
              onClick={() => setActiveMeasurementType(activeMeasurementType === "area" ? null : "area")}
            >
              <Calculator className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={activeMeasurementType === "angle" ? "default" : "outline"}
              onClick={() => setActiveMeasurementType(activeMeasurementType === "angle" ? null : "angle")}
            >
              <Move3D className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {activeMeasurementType && (
          <div className="p-3 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {activeMeasurementType === "distance" && "Click two points to measure distance"}
              {activeMeasurementType === "area" && "Click multiple points to measure area (close polygon)"}
              {activeMeasurementType === "angle" && "Click three points to measure angle"}
            </p>
          </div>
        )}

        {measurements.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Active Measurements</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {measurements.map((measurement) => {
                const Icon = getMeasurementIcon(measurement.type);
                return (
                  <div key={measurement.id} className="flex items-center justify-between p-2 bg-card rounded border">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <Badge className={getMeasurementColor(measurement.type)}>
                        {measurement.type}
                      </Badge>
                      <span className="text-sm font-medium">
                        {formatValue(measurement)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onMeasurementRemoved(measurement.id)}
                    >
                      ×
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {measurements.length === 0 && (
          <div className="text-center py-6">
            <Ruler className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No measurements yet. Select a tool and start measuring.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
