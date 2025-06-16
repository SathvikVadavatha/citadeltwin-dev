
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, RefreshCw, Plus } from 'lucide-react';
import { useQuantityTakeoff } from '@/hooks/useQuantityTakeoff';
import { useBIMElements } from '@/hooks/useBIMElements';
import { ElementsSummary } from './quantity-takeoff/ElementsSummary';
import { TakeoffSummary } from './quantity-takeoff/TakeoffSummary';

interface QuantityTakeoffPanelProps {
  estimationId: string;
}

export const QuantityTakeoffPanel = ({ estimationId }: QuantityTakeoffPanelProps) => {
  const { takeoffs, loading, generateTakeoffsFromElements, refreshTakeoffs } = useQuantityTakeoff(estimationId);
  const { elements, loading: elementsLoading } = useBIMElements();
  const [generating, setGenerating] = useState(false);

  const getElementTypeColor = (elementType: string) => {
    const colors = {
      wall: 'bg-blue-500/20 text-blue-400 border-blue-400/50',
      beam: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/50',
      column: 'bg-green-500/20 text-green-400 border-green-400/50',
      slab: 'bg-purple-500/20 text-purple-400 border-purple-400/50',
      foundation: 'bg-orange-500/20 text-orange-400 border-orange-400/50',
    };
    return colors[elementType as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border-gray-400/50';
  };

  const handleGenerateFromElements = async () => {
    setGenerating(true);
    try {
      await generateTakeoffsFromElements(elements);
    } finally {
      setGenerating(false);
    }
  };

  if (loading || elementsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading quantity takeoffs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Quantity Takeoffs</h3>
          <p className="text-sm text-muted-foreground">
            Automated quantity calculations from BIM elements
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={refreshTakeoffs} className="cyber-button">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleGenerateFromElements}
            disabled={generating || elements.length === 0}
            className="cyber-button"
          >
            {generating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Calculator className="w-4 h-4 mr-2" />
            )}
            Generate from BIM
          </Button>
        </div>
      </div>

      <ElementsSummary elements={elements} />

      {/* Generated Takeoffs */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="text-base">Generated Quantity Takeoffs</CardTitle>
        </CardHeader>
        <CardContent>
          {takeoffs.length === 0 ? (
            <div className="text-center py-8">
              <Calculator className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Quantity Takeoffs</h3>
              <p className="text-muted-foreground mb-4">
                Generate quantity takeoffs from your BIM elements to automatically calculate material quantities.
              </p>
              <Button
                onClick={handleGenerateFromElements}
                disabled={generating || elements.length === 0}
                className="cyber-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate Takeoffs
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {takeoffs.map((takeoff) => (
                <div key={takeoff.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={getElementTypeColor(takeoff.bim_elements?.element_type || 'unknown')}>
                        {takeoff.bim_elements?.element_type || 'Unknown'}
                      </Badge>
                      <span className="font-medium">{takeoff.bim_elements?.name || 'Unnamed Element'}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {takeoff.calculated_quantity.toFixed(3)} {takeoff.unit_of_measure}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Method: {takeoff.calculation_method}
                      </p>
                    </div>
                  </div>
                  
                  {takeoff.materials && (
                    <div className="mt-2 p-2 bg-accent/20 rounded">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Material: </span>
                        {takeoff.materials.name} ({takeoff.materials.material_type})
                      </p>
                    </div>
                  )}

                  {takeoff.geometry_data && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>Geometry: {JSON.stringify(takeoff.geometry_data).substring(0, 100)}...</p>
                    </div>
                  )}
                </div>
              ))}

              <TakeoffSummary takeoffs={takeoffs} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
