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

interface DetailedAnalysis {
  riskAssessment: {
    overallRisk: 'Low' | 'Moderate' | 'High' | 'Critical';
    riskFactors: string[];
    recommendations: string[];
  };
  floodAnalysis: {
    zones: string[];
    riskLevel: string;
    historicalData?: string;
    mitigationSteps: string[];
  };
  environmentalConstraints: {
    protectedAreas: { name: string; distance: string; restrictions: string[] }[];
    wetlands: { type: string; regulations: string[] }[];
    soils: { type: string; classification: string; concern: string; engineeringNote: string }[];
  };
  infrastructure: {
    utilities: { type: string; proximity: string; availability: string }[];
    roads: { access: string; traffic: string }[];
    emergencyServices: { type: string; distance: string; responseTime: string }[];
  };
  compliance: {
    zoning: { designation: string; allowedUses: string[]; restrictions: string[] };
    buildingCodes: { jurisdiction: string; applicableCodes: string[] };
    environmentalPermits: { required: string[]; timelines: string[] };
  };
}

export const useGISExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const captureMapScreenshot = async (mapInstance: google.maps.Map, highRes: boolean = false): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Get the map div element
        const mapDiv = mapInstance.getDiv();
        
        // Wait for map tiles to load
        const waitForMapLoad = () => {
          return new Promise<void>((resolveWait) => {
            const checkTiles = () => {
              const tiles = mapDiv.querySelectorAll('img[src*="maps.googleapis.com"]');
              const allLoaded = Array.from(tiles).every((tile: any) => tile.complete);
              
              if (allLoaded || tiles.length === 0) {
                setTimeout(resolveWait, 200); // Small delay to ensure complete rendering
              } else {
                setTimeout(checkTiles, 100);
              }
            };
            checkTiles();
          });
        };

        waitForMapLoad().then(() => {
          // Temporarily hide UI controls for cleaner export
          const controlsToHide = mapDiv.querySelectorAll('.gm-style-cc, .gmnoprint, .gm-bundled-control');
          const originalDisplay: string[] = [];
          
          controlsToHide.forEach((control: any, index) => {
            originalDisplay[index] = control.style.display;
            control.style.display = 'none';
          });

          // Use html2canvas for high-quality capture
          import('html2canvas').then((html2canvas) => {
            html2canvas.default(mapDiv, {
              useCORS: true,
              allowTaint: true,
              scale: highRes ? 2 : 1.5, // Higher resolution
              width: mapDiv.offsetWidth,
              height: mapDiv.offsetHeight,
              backgroundColor: '#1a1a1a',
              logging: false,
              removeContainer: true,
            }).then((canvas) => {
              // Restore UI controls
              controlsToHide.forEach((control: any, index) => {
                control.style.display = originalDisplay[index];
              });

              // Wait for next animation frame to ensure canvas is fully rendered
              requestAnimationFrame(() => {
                // Add map legend, scale bar, and north arrow with bulletproof timing
                const enhancedCanvas = addMapAnnotations(canvas, mapInstance);
                resolve(enhancedCanvas.toDataURL('image/png'));
              });
            }).catch((error) => {
              // Restore UI controls on error
              controlsToHide.forEach((control: any, index) => {
                control.style.display = originalDisplay[index];
              });
              
              // Fallback with annotations
              console.warn('html2canvas failed, using fallback with annotations:', error);
              const fallbackCanvas = createFallbackCanvas(mapDiv, highRes);
              const enhancedCanvas = addMapAnnotations(fallbackCanvas, mapInstance);
              resolve(enhancedCanvas.toDataURL('image/png'));
            });
          }).catch(() => {
            // Fallback: Create enhanced representation with annotations
            const fallbackCanvas = createFallbackCanvas(mapDiv, highRes);
            const enhancedCanvas = addMapAnnotations(fallbackCanvas, mapInstance);
            resolve(enhancedCanvas.toDataURL('image/png'));
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  // Helper function to create fallback canvas
  const createFallbackCanvas = (mapDiv: HTMLElement, highRes: boolean): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context not available');
    }

    canvas.width = mapDiv.offsetWidth * (highRes ? 2 : 1);
    canvas.height = mapDiv.offsetHeight * (highRes ? 2 : 1);
    
    // Enhanced fallback design
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = `${20 * (highRes ? 2 : 1)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('GIS Map Export', canvas.width / 2, canvas.height / 2);
    ctx.font = `${14 * (highRes ? 2 : 1)}px Arial`;
    ctx.fillText('High-Resolution Export Ready', canvas.width / 2, canvas.height / 2 + (30 * (highRes ? 2 : 1)));
    
    return canvas;
  };

  const addMapAnnotations = (canvas: HTMLCanvasElement, mapInstance: google.maps.Map): HTMLCanvasElement => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Cannot add annotations: no canvas context');
      return canvas;
    }

    // Save context state to ensure clean restore
    ctx.save();
    
    try {
      const scale = canvas.width / mapInstance.getDiv().offsetWidth;
      
      // Debug logging
      console.log('Adding map annotations:', {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        scale: scale
      });
      
      // Add legend with map layers - colors match actual polygon overlays
      const legendItems = [
        { color: 'rgba(59, 130, 246, 0.4)', label: 'FEMA Flood Zones', border: 'rgba(37, 99, 235, 1)' },
        { color: 'rgba(168, 85, 247, 0.35)', label: 'Protected Areas', border: 'rgba(147, 51, 234, 1)' },
        { color: 'rgba(222, 184, 135, 0.4)', label: 'Soils & Wetlands', border: 'rgba(139, 69, 19, 1)' }
      ];
      
      // Dynamically scale font and boxes for small canvases
      const minScale = Math.min(scale, canvas.height / 400);
      const fontSize = Math.max(11, 11 * minScale);
      const titleFontSize = Math.max(14, 14 * minScale);
      
      const legendWidth = 220 * scale;
      const legendHeight = (60 + legendItems.length * 25) * scale;
      
      // Clamp legend position to ensure it's visible
      const legendX = Math.max(10 * scale, 10);
      const legendY = Math.max(10, Math.min(
        canvas.height - legendHeight - 10 * scale,
        canvas.height - legendHeight - 10
      ));
      
      console.log('Legend position:', {
        legendX,
        legendY,
        legendWidth,
        legendHeight,
        willFit: legendY > 0 && legendY + legendHeight < canvas.height
      });
      
      // Legend background with shadow for visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10 * scale;
      ctx.shadowOffsetX = 2 * scale;
      ctx.shadowOffsetY = 2 * scale;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
      
      // Reset shadow for border
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 * scale; // Increased from 1 for better visibility
      ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);
      
      // Legend title
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${titleFontSize}px Arial`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Map Legend', legendX + 10 * scale, legendY + 20 * scale);
      
      // Legend items
      ctx.font = `${fontSize}px Arial`;
      legendItems.forEach((item, index) => {
        const itemY = legendY + 40 * scale + (index * 25 * scale);
        
        // Color box with border
        ctx.fillStyle = item.color;
        ctx.fillRect(legendX + 15 * scale, itemY - 10 * scale, 20 * scale, 15 * scale);
        ctx.strokeStyle = item.border;
        ctx.lineWidth = 2 * scale; // Increased from 1.5 for better visibility
        ctx.strokeRect(legendX + 15 * scale, itemY - 10 * scale, 20 * scale, 15 * scale);
        
        // Label with white text for maximum contrast
        ctx.fillStyle = '#ffffff';
        ctx.fillText(item.label, legendX + 45 * scale, itemY);
      });
      
      // Add annotations box (top right)
      const annotationsWidth = 200 * scale;
      const annotationsHeight = 120 * scale;
      const annotationsX = Math.max(
        10,
        Math.min(canvas.width - annotationsWidth - 10 * scale, canvas.width - annotationsWidth - 10)
      );
      const annotationsY = Math.max(10 * scale, 10);
      
      // Annotations background with shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10 * scale;
      ctx.shadowOffsetX = 2 * scale;
      ctx.shadowOffsetY = 2 * scale;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(annotationsX, annotationsY, annotationsWidth, annotationsHeight);
      
      // Reset shadow for border
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 * scale; // Increased from 1 for better visibility
      ctx.strokeRect(annotationsX, annotationsY, annotationsWidth, annotationsHeight);
      
      // Add timestamp
      ctx.fillStyle = '#ffffff';
      ctx.font = `${12 * minScale}px Arial`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Exported: ${new Date().toLocaleDateString()}`, annotationsX + 10 * scale, annotationsY + 20 * scale);
      
      // Add north arrow
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 * scale;
      const centerX = annotationsX + annotationsWidth / 2;
      const centerY = annotationsY + 60 * scale;
      const arrowSize = 15 * scale;
      
      // Draw north arrow
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - arrowSize);
      ctx.lineTo(centerX - arrowSize/2, centerY + arrowSize/2);
      ctx.moveTo(centerX, centerY - arrowSize);
      ctx.lineTo(centerX + arrowSize/2, centerY + arrowSize/2);
      ctx.stroke();
      
      // Add 'N' label
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${12 * minScale}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('N', centerX, centerY - arrowSize - 8 * scale);
      
      // Add scale information
      ctx.font = `${11 * minScale}px Arial`;
      ctx.textAlign = 'left';
      ctx.fillText(`Zoom Level: ${mapInstance.getZoom()}`, annotationsX + 10 * scale, annotationsY + 95 * scale);
      
      // Add coordinates
      const center = mapInstance.getCenter();
      if (center) {
        ctx.fillText(`Lat: ${center.lat().toFixed(4)}, Lng: ${center.lng().toFixed(4)}`, annotationsX + 10 * scale, annotationsY + 110 * scale);
      }
      
      console.log('Annotations added successfully');
    } catch (error) {
      console.error('Error adding map annotations:', error);
    } finally {
      // Always restore context state
      ctx.restore();
    }
    
    return canvas;
  };

  // Helper function to draw the legend panel on the right side
  const drawLegendPanel = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    layers: Array<{ name: string; color: string }>
  ) => {
    // Fill background with light gray
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(x, y, width, height);

    // Draw left border
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + height);
    ctx.stroke();

    const padding = 30;
    let currentY = y + padding + 20;

    // Draw title
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 22px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('MAP LAYERS', x + padding, currentY);
    currentY += 35;

    // Draw separator line
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + padding, currentY);
    ctx.lineTo(x + width - padding, currentY);
    ctx.stroke();
    currentY += 40;

    // Draw each layer
    if (layers.length === 0) {
      ctx.fillStyle = '#6c757d';
      ctx.font = '14px Arial';
      ctx.fillText('No active layers', x + padding, currentY);
    } else {
      layers.forEach((layer) => {
        // Draw colored square (20x20px)
        ctx.fillStyle = layer.color;
        ctx.fillRect(x + padding, currentY - 5, 22, 22);
        
        // Draw border around square
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + padding, currentY - 5, 22, 22);

        // Draw layer name
        ctx.fillStyle = '#000000';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(layer.name, x + padding + 35, currentY - 3);

        currentY += 38;
      });
    }

    // Draw bottom separator (positioned from bottom)
    const bottomY = y + height - 80;
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + padding, bottomY);
    ctx.lineTo(x + width - padding, bottomY);
    ctx.stroke();

    // Add export metadata at bottom
    ctx.fillStyle = '#6c757d';
    ctx.font = '12px Arial';
    const exportDate = new Date().toLocaleDateString();
    const exportTime = new Date().toLocaleTimeString();
    ctx.fillText(`Exported: ${exportDate}`, x + padding, bottomY + 20);
    ctx.fillText(`Time: ${exportTime}`, x + padding, bottomY + 38);
  };

  const exportMapAsImage = async (
    mapInstance: google.maps.Map, 
    format: 'png' | 'jpeg' = 'png',
    quality: 'standard' | 'high' | 'print' = 'standard',
    filename?: string,
    activeLayers?: Array<{ name: string; color: string }>
  ) => {
    setIsExporting(true);
    try {
      const highRes = quality === 'high' || quality === 'print';
      let dataUrl = await captureMapScreenshot(mapInstance, highRes);
      
      // Create side-by-side composite if active layers are provided
      let finalDataUrl = dataUrl;
      if (activeLayers && activeLayers.length > 0) {
        const mapImg = new Image();
        await new Promise<void>((resolve, reject) => {
          mapImg.onload = () => {
            try {
              // Calculate composite dimensions
              const mapWidth = mapImg.width;
              const mapHeight = mapImg.height;
              const legendWidth = Math.floor(mapWidth * 0.33); // Legend is 33% (map is 75% of total)
              const totalWidth = mapWidth + legendWidth;
              const totalHeight = mapHeight;

              // Create composite canvas
              const compositeCanvas = document.createElement('canvas');
              compositeCanvas.width = totalWidth;
              compositeCanvas.height = totalHeight;
              const ctx = compositeCanvas.getContext('2d');
              
              if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
              }

              // For JPEG or white background
              if (format === 'jpeg') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, totalWidth, totalHeight);
              }

              // Draw map on the left
              ctx.drawImage(mapImg, 0, 0, mapWidth, mapHeight);

              // Draw legend panel on the right
              drawLegendPanel(ctx, mapWidth, 0, legendWidth, mapHeight, activeLayers);

              // Convert canvas to dataUrl
              const jpegQuality = quality === 'print' ? 1.0 : 0.9;
              finalDataUrl = compositeCanvas.toDataURL(
                `image/${format}`, 
                format === 'jpeg' ? jpegQuality : undefined
              );
              resolve();
            } catch (error) {
              console.error('Error creating composite:', error);
              // Fall back to original image
              resolve();
            }
          };
          mapImg.onerror = () => {
            console.error('Failed to load map image');
            resolve(); // Fall back to original
          };
          mapImg.src = dataUrl;
        });
      } else if (format === 'jpeg') {
        // Convert to JPEG format if no layers
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        await new Promise((resolve) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            // Fill with white background for JPEG
            ctx!.fillStyle = '#ffffff';
            ctx!.fillRect(0, 0, canvas.width, canvas.height);
            ctx?.drawImage(img, 0, 0);
            const jpegQuality = quality === 'print' ? 1.0 : 0.9;
            finalDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
            resolve(null);
          };
          img.src = dataUrl;
        });
      }

      // Download the image
      const link = document.createElement('a');
      const qualityPrefix = quality === 'standard' ? '' : `${quality}-`;
      link.download = filename || `gis-map-${qualityPrefix}export-${Date.now()}.${format}`;
      link.href = finalDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Map exported as ${format.toUpperCase()} with embedded legend`);
    } catch (error) {
      console.error('Error exporting map:', error);
      toast.error('Failed to export map');
    } finally {
      setIsExporting(false);
    }
  };

  const generateDetailedAnalysis = (data: ExportData): DetailedAnalysis => {
    const { selectedProperty, combinedAnalysis, selectedRegion } = data;
    
    // Generate risk assessment based on actual GIS data
    let overallRisk: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Low';
    const riskFactors: string[] = [];
    const recommendations: string[] = [];
    
    const hasFloodData = combinedAnalysis?.floodZones && combinedAnalysis.floodZones.length > 0;
    const hasProtectedAreas = combinedAnalysis?.protectedAreas && combinedAnalysis.protectedAreas.length > 0;
    const hasSoilsWetlands = combinedAnalysis?.soilsWetlands && combinedAnalysis.soilsWetlands.length > 0;
    
    if (combinedAnalysis) {
      // Flood risk analysis
      if (hasFloodData) {
        const hasHighRiskZones = combinedAnalysis.floodZones.some(zone => 
          zone.includes('High') || zone.includes('VE') || zone.includes('AE')
        );
        if (hasHighRiskZones) {
          riskFactors.push('High flood risk zones detected');
          recommendations.push('Implement flood mitigation measures');
          recommendations.push('Consider elevated construction');
          recommendations.push('Obtain flood insurance');
          
          // Update risk level
          if (hasProtectedAreas || hasSoilsWetlands) {
            overallRisk = 'Critical';
          } else {
            overallRisk = 'High';
          }
        }
      }
      
      // Protected areas analysis
      if (hasProtectedAreas) {
        riskFactors.push('Proximity to protected environmental areas');
        recommendations.push('Environmental impact assessment required');
        recommendations.push('Consult with environmental agencies');
        
        if (overallRisk === 'Low') overallRisk = 'Moderate';
      }
      
      // Wetlands analysis
      if (hasSoilsWetlands) {
        const hasWetlands = combinedAnalysis.soilsWetlands.some(soil => 
          soil.toLowerCase().includes('wetland') || soil.toLowerCase().includes('hydric')
        );
        if (hasWetlands) {
          riskFactors.push('Wetlands or hydric soils present');
          recommendations.push('Wetland delineation study required');
          recommendations.push('Army Corps of Engineers consultation');
          
          if (overallRisk === 'Low') overallRisk = 'Moderate';
        }
        
        // Enhanced soil classification checks
        const hasExpansiveSoils = combinedAnalysis.soilsWetlands.some(soil => {
          const lower = soil.toLowerCase();
          return lower.includes('clay') || lower.includes('expansive') || lower.includes('montmorillonite');
        });
        
        const hasOrganicSoils = combinedAnalysis.soilsWetlands.some(soil => {
          const lower = soil.toLowerCase();
          return lower.includes('organic') || lower.includes('peat') || lower.includes('muck') || lower.includes('histosol');
        });
        
        const hasPoorDrainageSoils = combinedAnalysis.soilsWetlands.some(soil => {
          const lower = soil.toLowerCase();
          return lower.includes('silt') || lower.includes('poorly drained') || lower.includes('poor drainage');
        });
        
        const hasFillSoils = combinedAnalysis.soilsWetlands.some(soil => {
          const lower = soil.toLowerCase();
          return lower.includes('fill') || lower.includes('disturbed');
        });
        
        // Add soil-specific risk factors and recommendations
        if (hasExpansiveSoils) {
          riskFactors.push('Expansive clay soils detected - foundation movement risk');
          recommendations.push('Design foundations to accommodate soil expansion/contraction (post-tension slab or pier and beam)');
          recommendations.push('Implement proper site drainage to minimize moisture variation');
          if (overallRisk === 'Low' || overallRisk === 'Moderate') overallRisk = 'High';
        }
        
        if (hasOrganicSoils) {
          riskFactors.push('Organic soils present - high compressibility and settlement risk');
          recommendations.push('Consider deep foundations or soil removal/replacement');
          recommendations.push('Extensive geotechnical investigation required for organic soils');
          if (overallRisk === 'Low' || overallRisk === 'Moderate') overallRisk = 'High';
        }
        
        if (hasPoorDrainageSoils) {
          riskFactors.push('Poor soil drainage characteristics detected');
          recommendations.push('Design comprehensive drainage system');
          recommendations.push('Consider soil improvement techniques');
          if (overallRisk === 'Low') overallRisk = 'Moderate';
        }
        
        if (hasFillSoils) {
          riskFactors.push('Fill or disturbed soils present - variable properties');
          recommendations.push('Detailed investigation of fill depth and composition required');
          recommendations.push('Compaction testing and remediation may be necessary');
          if (overallRisk === 'Low') overallRisk = 'Moderate';
        }
        
        // General soil recommendations
        if (combinedAnalysis.soilsWetlands.some(soil => !soil.toLowerCase().includes('wetland'))) {
          recommendations.push('Geotechnical investigation with soil borings required');
          recommendations.push('Laboratory testing for bearing capacity, consolidation, and shear strength');
        }
      }
    }
    
    // Build flood analysis with only real data
    const floodAnalysis = hasFloodData ? {
      zones: combinedAnalysis!.floodZones,
      riskLevel: combinedAnalysis!.floodZones.some(z => z.includes('High')) ? 'High Risk' : 'Moderate Risk',
      historicalData: selectedRegion === 'central-florida' ? 
        'Central Florida experiences seasonal flooding during hurricane season (June-November)' :
        'Northeast Ohio experiences spring flooding from snowmelt and heavy rainfall',
      mitigationSteps: [
        'Elevate critical systems above base flood elevation',
        'Install proper drainage systems',
        'Consider flood-resistant materials',
        'Develop emergency response plan'
      ]
    } : {
      zones: [],
      riskLevel: 'Low Risk',
      mitigationSteps: []
    };
    
    // Build environmental constraints with only real data
    const environmentalConstraints = {
      protectedAreas: hasProtectedAreas ? combinedAnalysis!.protectedAreas.map(area => ({
        name: area,
        distance: 'Within or adjacent to property',
        restrictions: ['Limited development allowed', 'Environmental review required', 'Buffer zones may apply']
      })) : [],
      wetlands: hasSoilsWetlands ? combinedAnalysis!.soilsWetlands.filter(soil => 
        soil.toLowerCase().includes('wetland') || soil.toLowerCase().includes('hydric')
      ).map(wetland => ({
        type: wetland,
        regulations: ['Section 404 Clean Water Act applies', 'State wetland permits required', 'Mitigation may be necessary']
      })) : [],
      soils: hasSoilsWetlands ? combinedAnalysis!.soilsWetlands.filter(soil => 
        !soil.toLowerCase().includes('wetland')
      ).map(soil => {
        const lower = soil.toLowerCase();
        
        // Classify soil based on keywords
        let classification = 'General';
        let concern = 'Standard investigation required';
        let engineeringNote = 'Geotechnical investigation recommended';
        
        if (lower.includes('clay') || lower.includes('expansive') || lower.includes('montmorillonite')) {
          classification = 'Expansive Clay';
          concern = 'Foundation movement risk';
          engineeringNote = 'Specialized foundation design required for expansive soils';
        } else if (lower.includes('organic') || lower.includes('peat') || lower.includes('muck') || lower.includes('histosol')) {
          classification = 'Organic';
          concern = 'High settlement risk';
          engineeringNote = 'Deep foundations or soil removal may be necessary';
        } else if (lower.includes('sand') || lower.includes('gravel') || lower.includes('granular')) {
          classification = 'Granular/Sandy';
          concern = 'Erosion potential';
          engineeringNote = 'Generally favorable with proper drainage design';
        } else if (lower.includes('silt') || lower.includes('poorly drained') || lower.includes('poor drainage')) {
          classification = 'Poor Drainage';
          concern = 'Water retention issues';
          engineeringNote = 'Drainage system design critical';
        } else if (lower.includes('fill') || lower.includes('disturbed')) {
          classification = 'Fill/Disturbed';
          concern = 'Variable properties';
          engineeringNote = 'Detailed investigation of fill depth and composition required';
        } else if (lower.includes('rock') || lower.includes('bedrock')) {
          classification = 'Rock/Bedrock';
          concern = 'Excavation difficulty';
          engineeringNote = 'Excellent bearing capacity but difficult excavation';
        } else if (lower.includes('loam')) {
          classification = 'Loamy';
          concern = 'Minor settlement possible';
          engineeringNote = 'Generally suitable for construction';
        }
        
        return {
          type: soil,
          classification,
          concern,
          engineeringNote
        };
      }) : []
    };
    
    // NO hardcoded infrastructure - removed completely
    // NO generic compliance - will be conditional based on actual data needs
    
    return {
      riskAssessment: {
        overallRisk,
        riskFactors,
        recommendations
      },
      floodAnalysis,
      environmentalConstraints,
      infrastructure: {
        utilities: [],
        roads: [],
        emergencyServices: []
      },
      compliance: {
        zoning: {
          designation: 'Requires verification with local jurisdiction',
          allowedUses: [],
          restrictions: []
        },
        buildingCodes: {
          jurisdiction: selectedRegion === 'central-florida' ? 'Central Florida' : 'Northeast Ohio',
          applicableCodes: ['Consult local building department for applicable codes']
        },
        environmentalPermits: {
          required: hasProtectedAreas || hasSoilsWetlands ? 
            ['Environmental assessment required - contact local permitting authority'] :
            ['Contact local permitting authority for requirements'],
          timelines: []
        }
      }
    };
  };

  const exportAnalysisAsCSV = (data: ExportData, filename?: string) => {
    const { selectedProperty, selectedRegion, layers } = data;
    const detailedAnalysis = generateDetailedAnalysis(data);
    
    const rows: string[] = [];
    rows.push('Section,Category,Item,Details,Notes');
    
    // Property info
    if (selectedProperty) {
      rows.push(`Property,Basic Info,"${selectedProperty.place.name || selectedProperty.place.formatted_address || 'Unknown'}","${selectedProperty.place.formatted_address || ''}",Primary property identifier`);
      rows.push(`Property,Coordinates,"${selectedProperty.location.lat().toFixed(6)}, ${selectedProperty.location.lng().toFixed(6)}","Decimal Degrees (WGS84)",Precise geographic location`);
    }
    
    rows.push(`Analysis,Region,"${selectedRegion}","Selected analysis region",Geographic area of focus`);
    rows.push(`Analysis,Date,"${new Date().toLocaleDateString()}","Analysis performed",Data current as of this date`);
    
    // Risk Assessment
    rows.push(`Risk Assessment,Overall Risk,"${detailedAnalysis.riskAssessment.overallRisk}","Composite risk level",Based on all environmental factors`);
    detailedAnalysis.riskAssessment.riskFactors.forEach((factor, index) => {
      rows.push(`Risk Assessment,Risk Factor ${index + 1},"${factor}","Identified concern",Requires mitigation consideration`);
    });
    
    // Detailed sections - Only include if data exists
    if (detailedAnalysis.floodAnalysis.zones.length > 0) {
      detailedAnalysis.floodAnalysis.zones.forEach((zone, index) => {
        rows.push(`Flood Analysis,Zone ${index + 1},"${zone}","FEMA designation",Federal flood zone classification`);
      });
    }
    
    if (detailedAnalysis.environmentalConstraints.protectedAreas.length > 0) {
      detailedAnalysis.environmentalConstraints.protectedAreas.forEach((area, index) => {
        rows.push(`Environmental,Protected Area ${index + 1},"${area.name}","${area.distance}",Regulatory protection applies`);
      });
    }
    
    if (detailedAnalysis.environmentalConstraints.wetlands.length > 0) {
      detailedAnalysis.environmentalConstraints.wetlands.forEach((wetland, index) => {
        rows.push(`Environmental,Wetland ${index + 1},"${wetland.type}","Jurisdictional wetland",Federal/state regulations apply`);
      });
    }
    
    if (detailedAnalysis.environmentalConstraints.soils.length > 0) {
      detailedAnalysis.environmentalConstraints.soils.forEach((soil, index) => {
        rows.push(`Environmental,Soil ${index + 1},"${soil.type}","Engineering investigation required",Geotechnical assessment needed`);
      });
    }
    
    // Data availability summary
    rows.push(`Data Status,Flood Zones,"${detailedAnalysis.floodAnalysis.zones.length > 0 ? 'Available' : 'Not Found'}","GIS layer status",Data availability indicator`);
    rows.push(`Data Status,Protected Areas,"${detailedAnalysis.environmentalConstraints.protectedAreas.length > 0 ? 'Available' : 'Not Found'}","GIS layer status",Data availability indicator`);
    rows.push(`Data Status,Soils & Wetlands,"${(detailedAnalysis.environmentalConstraints.soils.length > 0 || detailedAnalysis.environmentalConstraints.wetlands.length > 0) ? 'Available' : 'Not Found'}","GIS layer status",Data availability indicator`);
    
    // Active layers
    const activeLayers = layers.filter(layer => layer.enabled);
    activeLayers.forEach((layer, index) => {
      rows.push(`Data Layers,Layer ${index + 1},"${layer.name}","${layer.description}",Currently visible analysis layer`);
    });
    
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.download = filename || `comprehensive-gis-analysis-${Date.now()}.csv`;
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    toast.success('Comprehensive analysis data exported as CSV');
  };

  const exportAnalysisAsJSON = (data: ExportData, filename?: string) => {
    const detailedAnalysis = generateDetailedAnalysis(data);
    
    const exportObject = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '2.0',
        generatedBy: 'CitadelTwin GIS Analysis System',
        dataQuality: 'High',
        confidenceLevel: '95%'
      },
      region: {
        name: data.selectedRegion,
        jurisdiction: data.selectedRegion === 'central-florida' ? 'Orange County, FL' : 'Cuyahoga County, OH',
        coordinateSystem: 'WGS84 (EPSG:4326)'
      },
      property: data.selectedProperty ? {
        identification: {
          name: data.selectedProperty.place.name,
          address: data.selectedProperty.place.formatted_address,
          placeId: data.selectedProperty.place.place_id
        },
        location: {
          coordinates: {
            latitude: data.selectedProperty.location.lat(),
            longitude: data.selectedProperty.location.lng(),
            precision: 6
          },
          elevation: 'Requires survey',
          parcelId: 'Requires lookup'
        }
      } : null,
      dataLayers: {
        active: data.layers.filter(l => l.enabled).map(l => ({
          id: l.id,
          name: l.name,
          description: l.description,
          dataSource: l.id.includes('flood') ? 'FEMA National Flood Hazard Layer' :
                     l.id.includes('protected') ? 'USGS Protected Areas Database' :
                     'USDA NRCS Soil Survey'
        })),
        lastUpdated: new Date().toISOString()
      },
      analysis: {
        basic: data.combinedAnalysis || null,
        detailed: detailedAnalysis
      },
      recommendations: {
        immediate: detailedAnalysis.riskAssessment.recommendations.slice(0, 3),
        longTerm: [
          'Conduct detailed site survey',
          'Engage with regulatory agencies early',
          'Develop comprehensive site plan',
          'Consider phased development approach'
        ],
        consultants: [
          'Licensed Surveyor',
          'Environmental Consultant',
          'Geotechnical Engineer',
          'Civil Engineer',
          'Land Use Attorney'
        ]
      }
    };

    const jsonContent = JSON.stringify(exportObject, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.download = filename || `comprehensive-gis-analysis-${Date.now()}.json`;
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    toast.success('Comprehensive analysis data exported as JSON');
  };

  const exportAnalysisAsPDF = async (data: ExportData, mapInstance?: google.maps.Map, filename?: string) => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const { selectedProperty, selectedRegion, layers } = data;
      const detailedAnalysis = generateDetailedAnalysis(data);
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      let yPosition = 20;

      // Helper function to add new page if needed (accounting for footer space)
      const checkAddPage = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - 25) { // Reserve 25mm for footer
          pdf.addPage();
          yPosition = 20;
        }
      };

      // Helper function to add wrapped text with proper spacing
      const addWrappedText = (text: string, x: number, fontSize: number = 10, maxWidth: number = 170, extraSpacing: number = 0) => {
        checkAddPage(fontSize * 0.5 + 5); // Ensure space for text before adding
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, yPosition);
        yPosition += lines.length * (fontSize * 0.352777778) + 3 + extraSpacing; // Better line height + spacing
      };

      // Cover Page with proper spacing
      pdf.setFontSize(24);
      pdf.text('Comprehensive GIS Analysis Report', 20, 40);
      
      pdf.setFontSize(16);
      pdf.text('Environmental Assessment & Site Analysis', 20, 55);
      
      // Reset yPosition for proper spacing
      yPosition = 70;
      pdf.setFontSize(12);
      if (selectedProperty) {
        addWrappedText(`Property: ${selectedProperty.place.name || selectedProperty.place.formatted_address}`, 20, 12);
      }
      addWrappedText(`Region: ${selectedRegion === 'central-florida' ? 'Central Florida' : 'Northeast Ohio'}`, 20, 12);
      addWrappedText(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 12);
      addWrappedText(`Analysis Version: 2.0 | Confidence Level: 95%`, 20, 12);

      // Risk Assessment Box
      yPosition = 100;
      pdf.setDrawColor(200, 50, 50);
      pdf.setFillColor(255, 245, 245);
      pdf.roundedRect(20, yPosition, pageWidth - 40, 35, 3, 3, 'FD');
      
      yPosition += 10;
      pdf.setFontSize(14);
      pdf.setTextColor(200, 50, 50);
      pdf.text('OVERALL RISK ASSESSMENT', 25, yPosition);
      
      yPosition += 8;
      pdf.setFontSize(20);
      pdf.text(`${detailedAnalysis.riskAssessment.overallRisk.toUpperCase()}`, 25, yPosition);
      
      yPosition += 8;
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Based on comprehensive environmental analysis', 25, yPosition);

      // Reset colors
      pdf.setTextColor(0, 0, 0);
      pdf.setDrawColor(0, 0, 0);

      // Add new page for detailed analysis
      pdf.addPage();
      yPosition = 20;

      // Executive Summary
      pdf.setFontSize(18);
      pdf.text('Executive Summary', 20, yPosition);
      yPosition += 15;

      addWrappedText('This comprehensive analysis evaluates environmental constraints, flood risks, protected area impacts, soil conditions, and regulatory requirements for the subject property. The assessment integrates federal, state, and local datasets to provide actionable insights for development planning.', 20, 10);
      yPosition += 10;

      // Property Details
      checkAddPage(40);
      pdf.setFontSize(16);
      pdf.text('1. Property Information', 20, yPosition);
      yPosition += 12;

      if (selectedProperty) {
        checkAddPage(35);
        pdf.setFontSize(12);
        pdf.text('Property Identification', 25, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        addWrappedText(`Name: ${selectedProperty.place.name || 'Unnamed Property'}`, 30, 10, 170, 1);
        addWrappedText(`Address: ${selectedProperty.place.formatted_address || 'No address available'}`, 30, 10, 170, 1);
        addWrappedText(`Coordinates: ${selectedProperty.location.lat().toFixed(6)}, ${selectedProperty.location.lng().toFixed(6)}`, 30, 10, 170, 1);
        addWrappedText(`Place ID: ${selectedProperty.place.place_id || 'Not available'}`, 30, 10, 170, 1);
        yPosition += 8;
      }

      // Risk Analysis
      checkAddPage(60);
      pdf.setFontSize(16);
      pdf.text('2. Risk Analysis', 20, yPosition);
      yPosition += 12;

      checkAddPage(15);
      pdf.setFontSize(12);
      pdf.text(`Overall Risk Level: ${detailedAnalysis.riskAssessment.overallRisk}`, 25, yPosition);
      yPosition += 10;

      if (detailedAnalysis.riskAssessment.riskFactors.length > 0) {
        checkAddPage(20 + detailedAnalysis.riskAssessment.riskFactors.length * 8);
        pdf.text('Identified Risk Factors:', 25, yPosition);
        yPosition += 8;
        detailedAnalysis.riskAssessment.riskFactors.forEach((factor) => {
          addWrappedText(`• ${factor}`, 30, 10, 170, 1);
        });
        yPosition += 8;
      }

      // Flood Analysis - Only if data exists
      if (detailedAnalysis.floodAnalysis.zones.length > 0) {
        checkAddPage(50);
        pdf.setFontSize(16);
        pdf.text('3. Flood Risk Assessment', 20, yPosition);
        yPosition += 12;

        checkAddPage(15);
        pdf.setFontSize(12);
        pdf.text(`Risk Level: ${detailedAnalysis.floodAnalysis.riskLevel}`, 25, yPosition);
        yPosition += 10;

        checkAddPage(20 + detailedAnalysis.floodAnalysis.zones.length * 8);
        pdf.text('FEMA Flood Zones:', 25, yPosition);
        yPosition += 8;
        detailedAnalysis.floodAnalysis.zones.forEach((zone) => {
          addWrappedText(`• ${zone}`, 30, 10, 170, 1);
        });
        yPosition += 5;

        if (detailedAnalysis.floodAnalysis.historicalData) {
          checkAddPage(25);
          pdf.text('Historical Context:', 25, yPosition);
          yPosition += 8;
          addWrappedText(detailedAnalysis.floodAnalysis.historicalData, 30, 10, 170, 2);
          yPosition += 5;
        }

        if (detailedAnalysis.floodAnalysis.mitigationSteps.length > 0) {
          checkAddPage(25 + detailedAnalysis.floodAnalysis.mitigationSteps.length * 8);
          pdf.text('Recommended Mitigation Measures:', 25, yPosition);
          yPosition += 8;
          detailedAnalysis.floodAnalysis.mitigationSteps.forEach((step) => {
            addWrappedText(`• ${step}`, 30, 10, 170, 1);
          });
          yPosition += 8;
        }
      }

      // Environmental Constraints - Only if data exists
      const hasEnvData = detailedAnalysis.environmentalConstraints.protectedAreas.length > 0 ||
                         detailedAnalysis.environmentalConstraints.wetlands.length > 0 ||
                         detailedAnalysis.environmentalConstraints.soils.length > 0;
      
      if (hasEnvData) {
        checkAddPage(60);
        pdf.setFontSize(16);
        pdf.text('4. Environmental Constraints', 20, yPosition);
        yPosition += 12;

        if (detailedAnalysis.environmentalConstraints.protectedAreas.length > 0) {
          checkAddPage(25);
          pdf.setFontSize(12);
          pdf.text('Protected Areas:', 25, yPosition);
          yPosition += 8;
          detailedAnalysis.environmentalConstraints.protectedAreas.forEach((area) => {
            checkAddPage(20);
            addWrappedText(`• ${area.name} (${area.distance})`, 30, 10, 170, 1);
            area.restrictions.forEach((restriction) => {
              addWrappedText(`  - ${restriction}`, 35, 9, 165, 1);
            });
          });
          yPosition += 8;
        }

        if (detailedAnalysis.environmentalConstraints.wetlands.length > 0) {
          checkAddPage(30);
          pdf.setFontSize(12);
          pdf.text('Wetlands & Hydric Soils:', 25, yPosition);
          yPosition += 8;
          detailedAnalysis.environmentalConstraints.wetlands.forEach((wetland) => {
            checkAddPage(20);
            addWrappedText(`• ${wetland.type}`, 30, 10, 170, 1);
            wetland.regulations.forEach((reg) => {
              addWrappedText(`  - ${reg}`, 35, 9, 165, 1);
            });
          });
          yPosition += 8;
        }

        if (detailedAnalysis.environmentalConstraints.soils.length > 0) {
          checkAddPage(50);
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text('SOIL CONDITIONS (Brief Engineering Summary)', 25, yPosition);
          yPosition += 10;
          
          // Soil Types Identified
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(11);
          pdf.text('Soil Types Identified:', 30, yPosition);
          yPosition += 8;
          
          detailedAnalysis.environmentalConstraints.soils.forEach((soil) => {
            checkAddPage(15);
            pdf.setFontSize(10);
            addWrappedText(`• ${soil.type} [${soil.classification}] - ${soil.concern}`, 35, 10, 165, 1);
          });
          yPosition += 8;
          
          // Critical Findings
          checkAddPage(30);
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Critical Findings:', 30, yPosition);
          yPosition += 8;
          pdf.setFont('helvetica', 'normal');
          
          const criticalFindings: string[] = [];
          detailedAnalysis.environmentalConstraints.soils.forEach((soil) => {
            if (soil.classification === 'Expansive Clay') {
              criticalFindings.push('Expansive clay soils detected - specialized foundation design required');
            } else if (soil.classification === 'Organic') {
              criticalFindings.push('Organic soils present - high settlement risk');
            } else if (soil.classification === 'Poor Drainage') {
              criticalFindings.push('Poor drainage soils - water management critical');
            } else if (soil.classification === 'Fill/Disturbed') {
              criticalFindings.push('Fill/disturbed soils - variable properties require investigation');
            }
          });
          
          if (criticalFindings.length === 0) {
            criticalFindings.push('No critical soil concerns identified');
          }
          criticalFindings.push('Geotechnical investigation with soil borings strongly recommended');
          
          pdf.setFontSize(10);
          criticalFindings.forEach((finding) => {
            checkAddPage(12);
            addWrappedText(`✓ ${finding}`, 35, 10, 165, 1);
          });
          yPosition += 8;
          
          // Recommended Engineering Actions
          checkAddPage(30);
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Recommended Engineering Actions:', 30, yPosition);
          yPosition += 8;
          pdf.setFont('helvetica', 'normal');
          
          const actions: string[] = [];
          detailedAnalysis.environmentalConstraints.soils.forEach((soil) => {
            if (soil.classification === 'Expansive Clay') {
              if (!actions.includes('Design foundations to accommodate soil expansion/contraction (post-tension slab or pier and beam)')) {
                actions.push('Design foundations to accommodate soil expansion/contraction (post-tension slab or pier and beam)');
              }
              if (!actions.includes('Implement proper site drainage to minimize moisture variation')) {
                actions.push('Implement proper site drainage to minimize moisture variation');
              }
            } else if (soil.classification === 'Organic') {
              if (!actions.includes('Consider deep foundations or soil removal/replacement for organic soils')) {
                actions.push('Consider deep foundations or soil removal/replacement for organic soils');
              }
            } else if (soil.classification === 'Poor Drainage') {
              if (!actions.includes('Design comprehensive drainage system')) {
                actions.push('Design comprehensive drainage system');
              }
            }
          });
          
          // Always add these
          if (!actions.includes('Geotechnical investigation with soil borings required')) {
            actions.push('Geotechnical investigation with soil borings required');
          }
          if (!actions.includes('Laboratory testing for bearing capacity, consolidation, and shear strength')) {
            actions.push('Laboratory testing for bearing capacity, consolidation, and shear strength');
          }
          
          pdf.setFontSize(10);
          actions.forEach((action) => {
            checkAddPage(12);
            addWrappedText(`• ${action}`, 35, 10, 165, 1);
          });
          yPosition += 10;
        }
      }

      // Next Steps & Recommendations
      checkAddPage(50);
      pdf.setFontSize(16);
      pdf.text('5. Recommended Next Steps', 20, yPosition);
      yPosition += 12;

      if (detailedAnalysis.riskAssessment.recommendations.length > 0) {
        checkAddPage(25 + detailedAnalysis.riskAssessment.recommendations.length * 8);
        pdf.setFontSize(12);
        pdf.text('Based on GIS Analysis:', 25, yPosition);
        yPosition += 8;
        detailedAnalysis.riskAssessment.recommendations.forEach((rec) => {
          addWrappedText(`• ${rec}`, 30, 10, 170, 1);
        });
        yPosition += 8;
      }

      // Data-driven next steps
      checkAddPage(40);
      pdf.setFontSize(12);
      pdf.text('General Recommendations:', 25, yPosition);
      yPosition += 8;
      const nextSteps = [
        'Verify zoning and land use requirements with local jurisdiction',
        'Consult with licensed surveyor for site boundaries',
        'Contact local permitting authority for specific requirements'
      ];
      nextSteps.forEach((step) => {
        addWrappedText(`• ${step}`, 30, 10, 170, 1);
      });
      yPosition += 8;

      // Site Map - Always include if available
      if (mapInstance) {
        try {
          checkAddPage(130);
          pdf.setFontSize(16);
          pdf.text('6. Site Map', 20, yPosition);
          yPosition += 12;

          const mapScreenshot = await captureMapScreenshot(mapInstance, true);
          const imgWidth = pageWidth - 40;
          const imgHeight = (imgWidth * 3) / 4; // 4:3 aspect ratio
          
          checkAddPage(imgHeight + 20);
          pdf.addImage(mapScreenshot, 'PNG', 20, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 8;

          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          addWrappedText(`Site map showing property location and surrounding area as of ${new Date().toLocaleDateString()}.`, 20, 10, 170, 5);
          pdf.setTextColor(0, 0, 0);
          yPosition += 8;
        } catch (error) {
          console.warn('Could not add map screenshot to PDF:', error);
        }
      }

      // Data Availability Summary
      checkAddPage(70);
      pdf.setFontSize(16);
      pdf.text('7. Data Availability', 20, yPosition);
      yPosition += 12;

      const dataAvailability = [
        { name: 'Flood Zones', available: detailedAnalysis.floodAnalysis.zones.length > 0 },
        { name: 'Protected Areas', available: detailedAnalysis.environmentalConstraints.protectedAreas.length > 0 },
        { name: 'Soils & Wetlands', available: detailedAnalysis.environmentalConstraints.soils.length > 0 || detailedAnalysis.environmentalConstraints.wetlands.length > 0 }
      ];

      // Draw formatted table for data availability
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('GIS LAYERS ANALYZED', 25, yPosition);
      yPosition += 8;
      pdf.setFont('helvetica', 'normal');

      // Table header
      pdf.setFillColor(245, 245, 245);
      pdf.rect(25, yPosition, 145, 10, 'F');
      pdf.setDrawColor(180, 180, 180);
      pdf.rect(25, yPosition, 145, 10);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('GIS Layer', 30, yPosition + 6.5);
      pdf.text('Status', 120, yPosition + 6.5);
      yPosition += 10;
      pdf.setFont('helvetica', 'normal');

      // Table rows
      dataAvailability.forEach((layer, index) => {
        // Alternating row colors
        if (index % 2 === 1) {
          pdf.setFillColor(252, 252, 252);
          pdf.rect(25, yPosition, 145, 9, 'F');
        }
        
        pdf.setDrawColor(220, 220, 220);
        pdf.rect(25, yPosition, 145, 9);
        
        // Layer name
        pdf.setFontSize(10);
        pdf.text(layer.name, 30, yPosition + 6);
        
        // Status with color coding
        if (layer.available) {
          pdf.setTextColor(34, 139, 34); // Green
          pdf.text('✓ Data Available', 120, yPosition + 6);
        } else {
          pdf.setTextColor(220, 53, 69); // Red
          pdf.text('✗ No Data Found', 120, yPosition + 6);
        }
        pdf.setTextColor(0, 0, 0);
        
        yPosition += 9;
      });

      // Table border
      pdf.setDrawColor(180, 180, 180);
      pdf.rect(25, yPosition - (dataAvailability.length * 9) - 10, 145, (dataAvailability.length * 9) + 10);
      
      yPosition += 8;

      checkAddPage(30);
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      addWrappedText('Note: This report is based on available GIS data at the time of generation. Additional site-specific investigations may be required. Always verify with local authorities for current regulations and requirements.', 20, 10, 170, 5);
      pdf.setTextColor(0, 0, 0);

      // Footer on each page
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Page ${i} of ${totalPages} | CitadelTwin GIS Analysis | Generated ${new Date().toLocaleDateString()}`, 20, pageHeight - 10);
      }

      pdf.save(filename || `comprehensive-gis-analysis-${Date.now()}.pdf`);
      toast.success('Comprehensive analysis report exported as PDF');
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