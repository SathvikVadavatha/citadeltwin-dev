import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, MapPin } from 'lucide-react';

interface FeatureInfo {
  title: string;
  properties: Record<string, any>;
  position: { lat: number; lng: number };
}

interface FeatureTooltipProps {
  feature: FeatureInfo;
  onClose: () => void;
}

export const FeatureTooltip: React.FC<FeatureTooltipProps> = ({ feature, onClose }) => {
  const formatPropertyValue = (key: string, value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    
    // Format specific property types
    switch (key.toLowerCase()) {
      case 'area':
      case 'acres':
        return `${value} acres`;
      case 'elevation':
        return `${value} ft`;
      case 'population':
        return value.toLocaleString();
      case 'gap_sts':
      case 'gapstatus':
        return `GAP Status ${value}`;
      default:
        return String(value);
    }
  };

  const getImportantProperties = (properties: Record<string, any>) => {
    const important = ['name', 'unit_nm', 'fld_zone', 'flood_zone', 'risk_level', 'gap_sts', 'mang_name', 'des_tp'];
    const result: Record<string, any> = {};
    
    // Add important properties first
    important.forEach(key => {
      const found = Object.keys(properties).find(k => k.toLowerCase() === key.toLowerCase());
      if (found && properties[found] !== null && properties[found] !== undefined) {
        result[found] = properties[found];
      }
    });
    
    // Add remaining properties (limit to 10 total)
    const remaining = Object.keys(properties).filter(k => 
      !important.some(imp => imp.toLowerCase() === k.toLowerCase())
    ).slice(0, 10 - Object.keys(result).length);
    
    remaining.forEach(key => {
      if (properties[key] !== null && properties[key] !== undefined) {
        result[key] = properties[key];
      }
    });
    
    return result;
  };

  const displayProperties = getImportantProperties(feature.properties);

  return (
    <div className="fixed top-4 right-4 z-50 w-80 max-h-96 overflow-y-auto">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {feature.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {feature.position.lat.toFixed(4)}, {feature.position.lng.toFixed(4)}
                </Badge>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {Object.keys(displayProperties).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(displayProperties).map(([key, value]) => (
                <div key={key} className="flex justify-between items-start gap-2">
                  <span className="text-xs font-medium text-muted-foreground capitalize min-w-0 flex-shrink-0">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="text-xs text-foreground text-right break-words">
                    {formatPropertyValue(key, value)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No additional information available for this location.
            </p>
          )}
          
          {Object.keys(feature.properties).length > Object.keys(displayProperties).length && (
            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
              +{Object.keys(feature.properties).length - Object.keys(displayProperties).length} more properties available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};