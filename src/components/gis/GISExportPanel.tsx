import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Image, File } from 'lucide-react';
import { useGISExport } from '@/hooks/useGISExport';

interface GISExportPanelProps {
  mapInstance?: google.maps.Map | null;
  selectedProperty?: {
    place: google.maps.places.PlaceResult;
    location: google.maps.LatLng;
  } | null;
  combinedAnalysis?: {
    floodZones: string[];
    protectedAreas: string[];
    soilsWetlands: string[];
  };
  selectedRegion: 'central-florida' | 'northeast-ohio';
  layers: Array<{
    id: string;
    name: string;
    enabled: boolean;
    description: string;
  }>;
}

export const GISExportPanel: React.FC<GISExportPanelProps> = ({
  mapInstance,
  selectedProperty,
  combinedAnalysis,
  selectedRegion,
  layers
}) => {
  const {
    isExporting,
    exportMapAsImage,
    exportAnalysisAsCSV,
    exportAnalysisAsPDF
  } = useGISExport();

  const [imageFormat, setImageFormat] = React.useState<'png' | 'jpeg'>('png');

  const exportData = {
    selectedProperty,
    combinedAnalysis,
    selectedRegion,
    layers
  };

  const hasAnalysisData = selectedProperty && combinedAnalysis && (
    combinedAnalysis.floodZones.length > 0 ||
    combinedAnalysis.protectedAreas.length > 0 ||
    combinedAnalysis.soilsWetlands.length > 0
  );

  const handleMapImageExport = () => {
    if (!mapInstance) {
      console.error('Map instance not available');
      return;
    }
    exportMapAsImage(mapInstance, imageFormat);
  };

  const handleAnalysisCSVExport = () => {
    exportAnalysisAsCSV(exportData);
  };

  const handleAnalysisPDFExport = () => {
    exportAnalysisAsPDF(exportData, mapInstance || undefined);
  };

  return (
    <Card style={{ backgroundColor: 'hsl(240 10% 3.9%)', borderColor: 'hsl(240 3.7% 15.9%)' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ color: 'hsl(0 0% 98%)' }}>
          <Download className="w-5 h-5" />
          Export Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map Export Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium" style={{ color: 'hsl(210 40% 98%)' }}>
            Map Export
          </h4>
          
          <div className="flex items-center gap-2">
            <Select value={imageFormat} onValueChange={(value: 'png' | 'jpeg') => setImageFormat(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpeg">JPEG</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              onClick={handleMapImageExport}
              disabled={isExporting || !mapInstance}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Image className="w-4 h-4" />
              Export Map
            </Button>
          </div>
          
          <p className="text-xs" style={{ color: 'hsl(240 5% 64.9%)' }}>
            Export current map view as an image file
          </p>
        </div>

        {/* Analysis Export Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium" style={{ color: 'hsl(210 40% 98%)' }}>
            Analysis Export
          </h4>
          
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={handleAnalysisPDFExport}
              disabled={isExporting || !hasAnalysisData}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 justify-start"
            >
              <FileText className="w-4 h-4" />
              Export as PDF Report
            </Button>
            
            <Button
              onClick={handleAnalysisCSVExport}
              disabled={isExporting || !hasAnalysisData}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 justify-start"
            >
              <File className="w-4 h-4" />
              Export as CSV
            </Button>
          </div>
          
          <p className="text-xs" style={{ color: 'hsl(240 5% 64.9%)' }}>
            {hasAnalysisData 
              ? 'Export analysis results in various formats'
              : 'Select a property and run analysis to enable exports'
            }
          </p>
        </div>

        {/* Export Status */}
        {isExporting && (
          <div className="flex items-center gap-2 p-2 rounded-md" style={{ backgroundColor: 'hsl(240 51% 15%)', border: '1px solid hsl(240 51% 25%)' }}>
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-sm" style={{ color: 'hsl(240 51% 75%)' }}>
              Exporting...
            </span>
          </div>
        )}

        {/* Export Summary */}
        {hasAnalysisData && (
          <div className="p-3 rounded-md" style={{ backgroundColor: 'hsl(142 51% 15%)', border: '1px solid hsl(142 51% 25%)' }}>
            <h5 className="text-sm font-medium mb-2" style={{ color: 'hsl(142 51% 95%)' }}>
              Export Summary
            </h5>
            <div className="text-xs space-y-1" style={{ color: 'hsl(142 51% 75%)' }}>
              <div>Property: {selectedProperty?.place.name || selectedProperty?.place.formatted_address || 'Unknown'}</div>
              <div>Region: {selectedRegion}</div>
              <div>Active Layers: {layers.filter(l => l.enabled).length}</div>
              {combinedAnalysis && (
                <>
                  {combinedAnalysis.floodZones.length > 0 && <div>Flood Zones: {combinedAnalysis.floodZones.length}</div>}
                  {combinedAnalysis.protectedAreas.length > 0 && <div>Protected Areas: {combinedAnalysis.protectedAreas.length}</div>}
                  {combinedAnalysis.soilsWetlands.length > 0 && <div>Soils & Wetlands: {combinedAnalysis.soilsWetlands.length}</div>}
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};