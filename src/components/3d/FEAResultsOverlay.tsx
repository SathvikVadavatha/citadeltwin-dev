
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface FEAResultsOverlayProps {
  results: {
    stress?: { values: number[]; max: number; min: number; unit: string };
    displacement?: { values: number[]; max: number; min: number; unit: string };
    safety_factor?: { values: number[]; max: number; min: number };
  };
  selectedElementIndex?: number;
  analysisType: string;
}

export const FEAResultsOverlay = ({ 
  results, 
  selectedElementIndex, 
  analysisType 
}: FEAResultsOverlayProps) => {
  const currentResult = results[analysisType as keyof typeof results];
  
  const selectedValue = useMemo(() => {
    if (!currentResult || selectedElementIndex === undefined) return null;
    return currentResult.values[selectedElementIndex];
  }, [currentResult, selectedElementIndex]);

  const getStatusColor = (value: number, type: string) => {
    switch (type) {
      case 'safety_factor':
        if (value >= 2.0) return 'text-green-500';
        if (value >= 1.5) return 'text-yellow-500';
        return 'text-red-500';
      case 'stress':
        const stressRatio = value / (currentResult?.max || 1);
        if (stressRatio < 0.5) return 'text-green-500';
        if (stressRatio < 0.8) return 'text-yellow-500';
        return 'text-red-500';
      default:
        return 'text-blue-500';
    }
  };

  const getStatusIcon = (value: number, type: string) => {
    const color = getStatusColor(value, type);
    if (color.includes('green')) return <CheckCircle className="w-4 h-4" />;
    if (color.includes('yellow')) return <AlertTriangle className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const formatValue = (value: number, unit?: string) => {
    if (Math.abs(value) < 1e-3) {
      return `${value.toExponential(2)}${unit ? ` ${unit}` : ''}`;
    }
    return `${value.toFixed(3)}${unit ? ` ${unit}` : ''}`;
  };

  const getProgressValue = (value: number, max: number, min: number) => {
    if (max === min) return 50;
    return ((value - min) / (max - min)) * 100;
  };

  if (!currentResult) {
    return (
      <Card className="absolute top-4 left-4 w-64 bg-background/90 backdrop-blur">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">No FEA results available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="absolute top-4 left-4 w-80 bg-background/90 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          FEA Results - {analysisType.replace('_', ' ').toUpperCase()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Color Legend */}
        <div className="space-y-2">
          <div className="text-xs font-medium">Color Scale</div>
          <div className="h-4 rounded bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-red-500"></div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Min: {formatValue(currentResult.min, currentResult.unit)}</span>
            <span>Max: {formatValue(currentResult.max, currentResult.unit)}</span>
          </div>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Elements</div>
            <div className="font-medium">{currentResult.values.length}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Range</div>
            <div className="font-medium text-xs">
              {formatValue(currentResult.max - currentResult.min, currentResult.unit)}
            </div>
          </div>
        </div>

        {/* Selected Element Details */}
        {selectedValue !== null && selectedElementIndex !== undefined && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Selected Element</span>
              <Badge variant="outline" className={getStatusColor(selectedValue, analysisType)}>
                {getStatusIcon(selectedValue, analysisType)}
                Element {selectedElementIndex + 1}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Value:</span>
                <span className={`text-sm font-medium ${getStatusColor(selectedValue, analysisType)}`}>
                  {formatValue(selectedValue, currentResult.unit)}
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Position in range:</span>
                  <span>{getProgressValue(selectedValue, currentResult.max, currentResult.min).toFixed(1)}%</span>
                </div>
                <Progress 
                  value={getProgressValue(selectedValue, currentResult.max, currentResult.min)} 
                  className="h-2"
                />
              </div>

              {analysisType === 'safety_factor' && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Status: </span>
                  <span className={getStatusColor(selectedValue, analysisType)}>
                    {selectedValue >= 2.0 ? 'Safe' : selectedValue >= 1.5 ? 'Caution' : 'Unsafe'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Critical Values Alert */}
        {analysisType === 'safety_factor' && (
          <div className="border-t pt-3">
            <div className="text-xs font-medium mb-2">Safety Assessment</div>
            <div className="space-y-1">
              {currentResult.values.filter(v => v < 1.5).length > 0 && (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="text-xs">
                    {currentResult.values.filter(v => v < 1.5).length} critical elements (SF < 1.5)
                  </span>
                </div>
              )}
              {currentResult.values.filter(v => v < 2.0 && v >= 1.5).length > 0 && (
                <div className="flex items-center gap-2 text-yellow-500">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="text-xs">
                    {currentResult.values.filter(v => v < 2.0 && v >= 1.5).length} elements need attention (SF < 2.0)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
