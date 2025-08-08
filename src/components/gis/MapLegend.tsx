import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

interface LayerConfig {
  id: string;
  name: string;
  type: 'flood_zones' | 'soil_types' | 'protected_lands' | 'roads' | 'wetlands' | 'utilities';
  enabled: boolean;
  color: string;
  opacity: number;
  description: string;
}

interface MapLegendProps {
  layers: LayerConfig[];
}

export const MapLegend: React.FC<MapLegendProps> = ({ layers }) => {
  if (layers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Info className="w-4 h-4" />
            Map Legend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Enable layers to see legend information
          </p>
        </CardContent>
      </Card>
    );
  }

  const getLayerLegendInfo = (layer: LayerConfig) => {
    switch (layer.type) {
      case 'flood_zones':
        return {
          items: [
            { color: '#EF4444', label: 'High Risk (AE/VE)', description: 'Insurance required' },
            { color: '#F59E0B', label: 'Moderate Risk (A)', description: 'Insurance recommended' },
            { color: '#3B82F6', label: 'Low Risk (X)', description: 'Minimal flood risk' }
          ]
        };
      case 'protected_lands':
        return {
          items: [
            { color: '#059669', label: 'GAP Status 1', description: 'Highest protection' },
            { color: '#10B981', label: 'GAP Status 2', description: 'Moderate protection' },
            { color: '#34D399', label: 'GAP Status 3', description: 'Limited protection' }
          ]
        };
      case 'soil_types':
        return {
          items: [
            { color: '#8B4513', label: 'Clay Soil', description: 'Poor drainage' },
            { color: '#DEB887', label: 'Sandy Soil', description: 'Good drainage' },
            { color: '#A0522D', label: 'Loam Soil', description: 'Balanced properties' }
          ]
        };
      case 'wetlands':
        return {
          items: [
            { color: '#1E40AF', label: 'Wetlands', description: 'Protected water areas' },
            { color: '#3B82F6', label: 'Water Bodies', description: 'Lakes and rivers' }
          ]
        };
      case 'utilities':
        return {
          items: [
            { color: '#FFA500', label: 'Electric Lines', description: 'Power infrastructure' },
            { color: '#9333EA', label: 'Water Lines', description: 'Water distribution' },
            { color: '#FACC15', label: 'Gas Lines', description: 'Natural gas' }
          ]
        };
      case 'roads':
        return {
          items: [
            { color: '#1F2937', label: 'Highways', description: 'Major roads' },
            { color: '#6B7280', label: 'Streets', description: 'Local roads' },
            { color: '#9CA3AF', label: 'Paths', description: 'Walking/bike paths' }
          ]
        };
      default:
        return { items: [] };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Info className="w-4 h-4" />
          Map Legend
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {layers.map((layer) => {
          const legendInfo = getLayerLegendInfo(layer);
          
          return (
            <div key={layer.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded border"
                  style={{ backgroundColor: layer.color }}
                />
                <span className="text-sm font-medium">{layer.name}</span>
                <Badge variant="outline" className="text-xs">
                  {Math.round(layer.opacity * 100)}%
                </Badge>
              </div>
              
              {legendInfo.items.length > 0 && (
                <div className="ml-5 space-y-1">
                  {legendInfo.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-foreground">{item.label}</span>
                      <span className="text-xs text-muted-foreground">- {item.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Click on colored areas for detailed information
          </p>
        </div>
      </CardContent>
    </Card>
  );
};