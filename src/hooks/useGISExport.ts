import { useState } from 'react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface ExportData {
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

export const useGISExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const captureMapScreenshot = async (mapInstance: google.maps.Map): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Get the map div element
        const mapDiv = mapInstance.getDiv();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        canvas.width = mapDiv.offsetWidth;
        canvas.height = mapDiv.offsetHeight;

        // Use html2canvas alternative - create image from map div
        import('html2canvas').then((html2canvas) => {
          html2canvas.default(mapDiv, {
            useCORS: true,
            allowTaint: true,
            scale: 1,
            width: mapDiv.offsetWidth,
            height: mapDiv.offsetHeight,
          }).then((canvas) => {
            resolve(canvas.toDataURL('image/png'));
          }).catch(reject);
        }).catch(() => {
          // Fallback: Create a simple representation
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#ffffff';
          ctx.font = '20px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('GIS Map Export', canvas.width / 2, canvas.height / 2);
          resolve(canvas.toDataURL('image/png'));
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  const exportMapAsImage = async (
    mapInstance: google.maps.Map, 
    format: 'png' | 'jpeg' = 'png',
    filename?: string
  ) => {
    setIsExporting(true);
    try {
      const dataUrl = await captureMapScreenshot(mapInstance);
      
      // Convert to desired format if needed
      let finalDataUrl = dataUrl;
      if (format === 'jpeg') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        await new Promise((resolve) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            finalDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            resolve(null);
          };
          img.src = dataUrl;
        });
      }

      // Download the image
      const link = document.createElement('a');
      link.download = filename || `gis-map-export-${Date.now()}.${format}`;
      link.href = finalDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Map exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting map:', error);
      toast.error('Failed to export map');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAnalysisAsCSV = (data: ExportData, filename?: string) => {
    const { selectedProperty, combinedAnalysis, selectedRegion, layers } = data;
    
    const rows: string[] = [];
    rows.push('Category,Item,Details');
    
    // Property info
    if (selectedProperty) {
      rows.push(`Property,"${selectedProperty.place.name || selectedProperty.place.formatted_address || 'Unknown'}","${selectedProperty.place.formatted_address || ''}"`);
      rows.push(`Location,"${selectedProperty.location.lat().toFixed(6)}, ${selectedProperty.location.lng().toFixed(6)}","Latitude, Longitude"`);
    }
    
    rows.push(`Region,"${selectedRegion}","Selected analysis region"`);
    
    // Active layers
    const activeLayers = layers.filter(layer => layer.enabled);
    if (activeLayers.length > 0) {
      rows.push(`Active Layers,"${activeLayers.map(l => l.name).join('; ')}","Currently visible layers"`);
    }
    
    // Analysis results
    if (combinedAnalysis) {
      if (combinedAnalysis.floodZones.length > 0) {
        combinedAnalysis.floodZones.forEach(zone => {
          rows.push(`Flood Zone,"${zone}","FEMA flood zone designation"`);
        });
      }
      
      if (combinedAnalysis.protectedAreas.length > 0) {
        combinedAnalysis.protectedAreas.forEach(area => {
          rows.push(`Protected Area,"${area}","Protected lands and conservation areas"`);
        });
      }
      
      if (combinedAnalysis.soilsWetlands.length > 0) {
        combinedAnalysis.soilsWetlands.forEach(soil => {
          rows.push(`Soils & Wetlands,"${soil}","Soil types and wetland areas"`);
        });
      }
    }
    
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.download = filename || `gis-analysis-${Date.now()}.csv`;
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    toast.success('Analysis data exported as CSV');
  };

  const exportAnalysisAsJSON = (data: ExportData, filename?: string) => {
    const exportObject = {
      timestamp: new Date().toISOString(),
      region: data.selectedRegion,
      property: data.selectedProperty ? {
        name: data.selectedProperty.place.name,
        address: data.selectedProperty.place.formatted_address,
        coordinates: {
          lat: data.selectedProperty.location.lat(),
          lng: data.selectedProperty.location.lng()
        }
      } : null,
      activeLayers: data.layers.filter(l => l.enabled).map(l => ({
        id: l.id,
        name: l.name,
        description: l.description
      })),
      analysis: data.combinedAnalysis || null
    };

    const jsonContent = JSON.stringify(exportObject, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.download = filename || `gis-analysis-${Date.now()}.json`;
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    toast.success('Analysis data exported as JSON');
  };

  const exportAnalysisAsPDF = async (data: ExportData, mapInstance?: google.maps.Map, filename?: string) => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF();
      const { selectedProperty, combinedAnalysis, selectedRegion, layers } = data;

      // Title
      pdf.setFontSize(20);
      pdf.text('GIS Analysis Report', 20, 30);

      // Metadata
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
      pdf.text(`Region: ${selectedRegion}`, 20, 55);

      let yPosition = 70;

      // Property information
      if (selectedProperty) {
        pdf.setFontSize(14);
        pdf.text('Property Information', 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        const propertyName = selectedProperty.place.name || 'Unnamed Property';
        const address = selectedProperty.place.formatted_address || 'No address available';
        
        pdf.text(`Name: ${propertyName}`, 25, yPosition);
        yPosition += 8;
        pdf.text(`Address: ${address}`, 25, yPosition);
        yPosition += 8;
        pdf.text(`Coordinates: ${selectedProperty.location.lat().toFixed(6)}, ${selectedProperty.location.lng().toFixed(6)}`, 25, yPosition);
        yPosition += 15;
      }

      // Active layers
      const activeLayers = layers.filter(layer => layer.enabled);
      if (activeLayers.length > 0) {
        pdf.setFontSize(14);
        pdf.text('Active Layers', 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        activeLayers.forEach(layer => {
          pdf.text(`• ${layer.name}: ${layer.description}`, 25, yPosition);
          yPosition += 8;
        });
        yPosition += 10;
      }

      // Analysis results
      if (combinedAnalysis) {
        if (combinedAnalysis.floodZones.length > 0) {
          pdf.setFontSize(14);
          pdf.text('FEMA Flood Zones', 20, yPosition);
          yPosition += 10;
          
          pdf.setFontSize(10);
          combinedAnalysis.floodZones.forEach(zone => {
            pdf.text(`• ${zone}`, 25, yPosition);
            yPosition += 8;
          });
          yPosition += 10;
        }

        if (combinedAnalysis.protectedAreas.length > 0) {
          pdf.setFontSize(14);
          pdf.text('Protected Areas', 20, yPosition);
          yPosition += 10;
          
          pdf.setFontSize(10);
          combinedAnalysis.protectedAreas.forEach(area => {
            pdf.text(`• ${area}`, 25, yPosition);
            yPosition += 8;
          });
          yPosition += 10;
        }

        if (combinedAnalysis.soilsWetlands.length > 0) {
          pdf.setFontSize(14);
          pdf.text('Soils & Wetlands', 20, yPosition);
          yPosition += 10;
          
          pdf.setFontSize(10);
          combinedAnalysis.soilsWetlands.forEach(soil => {
            pdf.text(`• ${soil}`, 25, yPosition);
            yPosition += 8;
          });
          yPosition += 10;
        }
      }

      // Add map screenshot if available
      if (mapInstance && yPosition < 200) {
        try {
          const mapScreenshot = await captureMapScreenshot(mapInstance);
          const imgWidth = 170;
          const imgHeight = 100;
          
          if (yPosition + imgHeight > 280) {
            pdf.addPage();
            yPosition = 30;
          }
          
          pdf.addImage(mapScreenshot, 'PNG', 20, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        } catch (error) {
          console.warn('Could not add map screenshot to PDF:', error);
        }
      }

      pdf.save(filename || `gis-analysis-report-${Date.now()}.pdf`);
      toast.success('Analysis report exported as PDF');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF report');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    exportMapAsImage,
    exportAnalysisAsCSV,
    exportAnalysisAsJSON,
    exportAnalysisAsPDF
  };
};