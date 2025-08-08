import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Download, Layers, RefreshCw } from 'lucide-react';

interface LayerConfig {
  id: string;
  name: string;
  type: 'flood_zones' | 'soil_types' | 'protected_lands' | 'roads' | 'wetlands' | 'utilities';
  enabled: boolean;
  color: string;
  opacity: number;
  description: string;
}

interface LayerTogglePanelProps {
  layers: LayerConfig[];
  onToggleLayer: (layerId: string) => void;
  onUpdateOpacity: (layerId: string, opacity: number) => void;
  onFetchData: (location: string) => void;
  isFetching: boolean;
}

export const LayerTogglePanel: React.FC<LayerTogglePanelProps> = ({
  layers,
  onToggleLayer,
  onUpdateOpacity,
  onFetchData,
  isFetching
}) => {
  const enabledLayers = layers.filter(l => l.enabled);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Layers className="w-4 h-4" />
            Layer Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => onFetchData('central-florida')}
            disabled={isFetching}
            className="w-full"
            size="sm"
          >
            {isFetching ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Fetch GIS Data
              </>
            )}
          </Button>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Available Layers</Label>
              <Badge variant="outline" className="text-xs">
                {enabledLayers.length}/{layers.length} enabled
              </Badge>
            </div>

            {layers.map((layer) => (
              <div key={layer.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded border"
                      style={{ backgroundColor: layer.color }}
                    />
                    <Label className="text-xs cursor-pointer" onClick={() => onToggleLayer(layer.id)}>
                      {layer.name}
                    </Label>
                  </div>
                  <Switch
                    checked={layer.enabled}
                    onCheckedChange={() => onToggleLayer(layer.id)}
                  />
                </div>

                {layer.enabled && (
                  <div className="ml-5 space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Opacity</Label>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(layer.opacity * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={[layer.opacity]}
                      onValueChange={([value]) => onUpdateOpacity(layer.id, value)}
                      max={1}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                )}

                <p className="text-xs text-muted-foreground ml-5">
                  {layer.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};