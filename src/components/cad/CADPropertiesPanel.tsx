
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface CADPropertiesPanelProps {
  gridSize: number;
  snapToGrid: boolean;
  selectedObject: any;
  measurements: any[];
  onGridSizeChange?: (size: number) => void;
  onSnapToGridChange?: (snap: boolean) => void;
}

export const CADPropertiesPanel = ({
  gridSize,
  snapToGrid,
  selectedObject,
  measurements,
  onGridSizeChange,
  onSnapToGridChange
}: CADPropertiesPanelProps) => {
  return (
    <div className="w-80 space-y-4">
      {/* Grid Settings */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold">Grid Settings</h3>
          <div className="space-y-2">
            <Label htmlFor="gridSize">Grid Size</Label>
            <Input
              id="gridSize"
              type="number"
              value={gridSize}
              onChange={(e) => onGridSizeChange?.(Number(e.target.value))}
              min="5"
              max="50"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="snapToGrid"
              checked={snapToGrid}
              onChange={(e) => onSnapToGridChange?.(e.target.checked)}
            />
            <Label htmlFor="snapToGrid">Snap to Grid</Label>
          </div>
        </CardContent>
      </Card>

      {/* Selected Object Properties */}
      {selectedObject && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">Object Properties</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Type:</span>
                <Badge variant="outline">{selectedObject.type}</Badge>
              </div>
              <div className="flex justify-between">
                <span>X:</span>
                <span>{selectedObject.left?.toFixed(2) || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Y:</span>
                <span>{selectedObject.top?.toFixed(2) || 0}</span>
              </div>
              {selectedObject.width && (
                <div className="flex justify-between">
                  <span>Width:</span>
                  <span>{selectedObject.width.toFixed(2)}</span>
                </div>
              )}
              {selectedObject.height && (
                <div className="flex justify-between">
                  <span>Height:</span>
                  <span>{selectedObject.height.toFixed(2)}</span>
                </div>
              )}
              {selectedObject.radius && (
                <div className="flex justify-between">
                  <span>Radius:</span>
                  <span>{selectedObject.radius.toFixed(2)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Measurements */}
      {measurements.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">Measurements</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {measurements.map((measurement) => (
                <div key={measurement.id} className="flex justify-between text-sm">
                  <span>{measurement.type}:</span>
                  <span>{measurement.distance} px</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
