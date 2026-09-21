// @ts-nocheck
import React, { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Layers,
  MapPin,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image,
  File,
  Loader2,
  AlertTriangle,
  Shield,
  Droplets,
  Info,
  History
} from 'lucide-react';
import { useGISExport } from '@/hooks/useGISExport';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  buildAnalysisSummary,
  constructionImplications,
  disasterIcon,
  disasterBadgeColor
} from '@/components/gis/utils/analysisSummary';

interface LayerToggle {
  id: string;
  name: string;
  type: 'flood_zones' | 'soil_types' | 'protected_lands' | 'roads' | 'wetlands' | 'utilities' | 'soils';
  enabled: boolean;
  color: string;
  description: string;
}

interface CurrentLocation {
  city: string;
  state: string;
  lat: number;
  lng: number;
  displayName: string;
}

interface DisasterRecord {
  disasterNumber: number | null;
  declarationDate: string | null;
  incidentType: string;
  declarationTitle: string;
  designatedArea: string;
  incidentBeginDate: string | null;
  incidentEndDate: string | null;
}

interface GISSidebarProps {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
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
  currentLocation: CurrentLocation;
  layers: LayerToggle[];
  onToggleLayer: (layerId: string) => void;
  environmentalLayers: any[];
  isFetching: boolean;
  disasterHistory?: DisasterRecord[];
  disasterHistoryLoading?: boolean;
  lastAnalyzedAt?: string | null;
}

export const GISSidebar: React.FC<GISSidebarProps> = ({
  isCollapsed,
  onToggleCollapsed,
  mapInstance,
  selectedProperty,
  combinedAnalysis,
  currentLocation,
  layers,
  onToggleLayer,
  environmentalLayers,
  isFetching,
  disasterHistory,
  disasterHistoryLoading,
  lastAnalyzedAt
}) => {
  const [activeTab, setActiveTab] = useState('layers');
  const [imageFormat, setImageFormat] = useState<'png' | 'jpeg'>('png');
  const [imageQuality, setImageQuality] = useState<'standard' | 'high' | 'print'>('high');
  
  const {
    isExporting,
    exportMapAsImage,
    exportAnalysisAsCSV,
    exportAnalysisAsPDF
  } = useGISExport();

  const exportData = {
    selectedProperty,
    combinedAnalysis,
    currentLocation,
    layers
  };

  const hasSearched = !!(currentLocation.city && currentLocation.state);

  const summary = useMemo(() => {
    if (!hasSearched) return null;
    return buildAnalysisSummary(
      environmentalLayers || [],
      currentLocation.city,
      currentLocation.state,
      currentLocation.lat,
      currentLocation.lng
    );
  }, [environmentalLayers, currentLocation, hasSearched]);

  const floodBadgeClass = (level: string) => {
    if (level === 'HIGH') return 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300';
    if (level === 'MODERATE') return 'border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300';
    if (level === 'LOW') return 'border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300';
    return 'border-muted-foreground/30 bg-muted text-muted-foreground';
  };

  const suitabilityBarClass = (color: string) => {
    if (color === 'green') return 'bg-green-500';
    if (color === 'yellow') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDisasterDate = (iso: string | null): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const generateAnalysisReportPDF = async () => {
    if (!summary) return;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;
    let y = margin;

    const addFooter = () => {
      pdf.setFontSize(8);
      pdf.setTextColor(140, 140, 140);
      pdf.text(
        `CitadelTwin GIS Analysis · Generated ${new Date().toLocaleDateString()}`,
        margin,
        pageHeight - 10
      );
      pdf.setTextColor(0, 0, 0);
    };

    const addHeading = (text: string, size = 18) => {
      pdf.setFontSize(size);
      pdf.setFont('helvetica', 'bold');
      pdf.text(text, margin, y);
      y += size * 0.5 + 4;
      pdf.setFont('helvetica', 'normal');
    };

    const addText = (text: string, size = 11) => {
      pdf.setFontSize(size);
      const lines = pdf.splitTextToSize(text, pageWidth - margin * 2);
      pdf.text(lines, margin, y);
      y += lines.length * (size * 0.45) + 2;
    };

    const newPage = () => {
      addFooter();
      pdf.addPage();
      y = margin;
    };

    // ---- PAGE 1: HEADER ----
    try {
      const logoResponse = await fetch('/citadeltwin-logo.webp');
      const blob = await logoResponse.blob();
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      pdf.addImage(dataUrl, 'PNG', margin, y, 16, 16);
    } catch {
      // Logo is optional — skip silently if fetch fails
    }
    y += 22;

    addHeading('GIS Site Analysis Report', 22);
    y += 2;
    addText(`Location: ${currentLocation.city || 'Unknown'}, ${currentLocation.state || ''}`, 12);
    addText(`Coordinates: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`, 12);
    addText(`Date: ${new Date().toLocaleDateString()}`, 12);
    addText('Generated by: CitadelTwin GIS Analysis', 12);

    // ---- PAGE 2: FINDINGS SUMMARY ----
    newPage();
    addHeading('Findings Summary');
    addText(`Site Suitability Score: ${summary.suitability.score}/10`, 12);
    addText(`Flood Risk Level: ${summary.flood.riskLevel}`, 12);
    addText(`Flood Zones Found: ${summary.flood.zoneCount} zone${summary.flood.zoneCount === 1 ? '' : 's'}`, 12);
    addText(`Highest Risk Zone: ${summary.flood.highestZone || 'N/A'}`, 12);
    addText(`Protected Areas Nearby: ${summary.protected.count} area${summary.protected.count === 1 ? '' : 's'}`, 12);
    addText(`Wetlands Present: ${summary.soils.wetlandsPresent ? 'Yes' : 'No'}`, 12);
    if (summary.soils.dominantSoil) {
      addText(`Dominant Soil: ${summary.soils.dominantSoil}`, 12);
    }

    // ---- PAGE 3: FLOOD ZONE DETAILS ----
    newPage();
    addHeading('Flood Zone Details');
    if (summary.flood.zoneCount === 0) {
      addText('No FEMA flood zones found near this location.');
    } else {
      addText(`Zones found: ${summary.flood.zoneCount}`, 11);
      addText(`Highest risk: ${summary.flood.highestZone || 'N/A'} — ${summary.flood.explanation}`, 11);
      addText(`Construction implications: ${constructionImplications(summary.flood.highestZone)}`, 11);
      y += 4;
      addText('Source: FEMA National Flood Hazard Layer (NFHL)', 10);
    }

    // ---- PAGE 4: DISASTER HISTORY ----
    newPage();
    addHeading('Federal Disaster History');
    const disasters = disasterHistory || [];
    if (disasters.length === 0) {
      addText('No major federal disaster declarations found for this area.');
    } else {
      for (const d of disasters.slice(0, 10)) {
        addText(
          `${formatDisasterDate(d.declarationDate)} · ${d.incidentType} — ${d.declarationTitle}`,
          11
        );
      }
      y += 4;
      addText('Source: FEMA OpenFEMA — Federal disaster declarations only', 10);
    }

    // ---- PAGE 5: DISCLAIMER ----
    newPage();
    addHeading('Disclaimer');
    addText(
      'This report is generated from publicly available federal data sources including FEMA NFHL, USGS PAD-US, USFWS NWI, and OpenFEMA. It is intended for preliminary site assessment only and should not replace a professional site survey or flood elevation certificate. Always consult local authorities and licensed professionals before making construction decisions.',
      11
    );
    addFooter();

    const filename = `gis-analysis-${currentLocation.city || 'site'}-${Date.now()}.pdf`;
    pdf.save(filename);
  };

  const hasAnalysisData = selectedProperty && combinedAnalysis && (
    combinedAnalysis.floodZones.length > 0 ||
    combinedAnalysis.protectedAreas.length > 0 ||
    combinedAnalysis.soilsWetlands.length > 0
  );

  const handleMapImageExport = () => {
    if (!mapInstance) return;
    
    // Build active layers list with data
    const activeLayers = [];
    if (combinedAnalysis?.floodZones && combinedAnalysis.floodZones.length > 0) {
      activeLayers.push({ name: 'Flood Zones', color: 'rgb(0, 102, 204)' });
    }
    if (combinedAnalysis?.protectedAreas && combinedAnalysis.protectedAreas.length > 0) {
      activeLayers.push({ name: 'Protected Areas', color: 'rgb(147, 51, 234)' });
    }
    if (combinedAnalysis?.soilsWetlands && combinedAnalysis.soilsWetlands.length > 0) {
      activeLayers.push({ name: 'Soils & Wetlands', color: 'rgb(217, 179, 140)' });
    }
    
    exportMapAsImage(mapInstance, imageFormat, imageQuality, undefined, activeLayers);
  };

  const getRiskLevel = () => {
    if (!combinedAnalysis) return 'Unknown';
    
    const hasHighRiskFlood = combinedAnalysis.floodZones.some(zone => 
      zone.includes('High') || zone.includes('VE') || zone.includes('AE')
    );
    const hasProtectedAreas = combinedAnalysis.protectedAreas.length > 0;
    const hasWetlands = combinedAnalysis.soilsWetlands.some(soil => 
      soil.toLowerCase().includes('wetland') || soil.toLowerCase().includes('hydric')
    );
    
    // Enhanced soil risk checks
    const hasHighRiskSoils = combinedAnalysis.soilsWetlands.some(soil => {
      const lower = soil.toLowerCase();
      return lower.includes('clay') || lower.includes('expansive') || 
             lower.includes('organic') || lower.includes('peat') || lower.includes('muck');
    });
    
    const hasModerateRiskSoils = combinedAnalysis.soilsWetlands.some(soil => {
      const lower = soil.toLowerCase();
      return lower.includes('fill') || lower.includes('disturbed') ||
             lower.includes('poorly drained') || lower.includes('poor drainage') || lower.includes('silt');
    });
    
    if (hasHighRiskFlood && (hasProtectedAreas || hasWetlands || hasHighRiskSoils)) return 'Critical';
    if (hasHighRiskFlood || hasHighRiskSoils || (hasProtectedAreas && hasWetlands)) return 'High';
    if (hasProtectedAreas || hasWetlands || hasModerateRiskSoils) return 'Moderate';
    return 'Low';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Critical': return 'hsl(0 70% 50%)';
      case 'High': return 'hsl(15 80% 55%)';
      case 'Moderate': return 'hsl(45 90% 60%)';
      case 'Low': return 'hsl(120 50% 50%)';
      default: return 'hsl(215 20% 50%)';
    }
  };

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-4 space-y-4 w-14 border-r border-border bg-card/50">
        <Button
          onClick={onToggleCollapsed}
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <div className="flex flex-col space-y-2">
          <Button
            onClick={() => {
              onToggleCollapsed();
              setActiveTab('layers');
            }}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            title="Map Layers"
          >
            <Layers className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={() => {
              onToggleCollapsed();
              setActiveTab('analysis');
            }}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            title="Analysis Results"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={() => {
              onToggleCollapsed();
              setActiveTab('export');
            }}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            title="Export Options"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={() => {
              onToggleCollapsed();
              setActiveTab('settings');
            }}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {hasAnalysisData && (
          <div className="mt-4">
            <div 
              className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
              style={{ 
                borderColor: getRiskColor(getRiskLevel()),
                backgroundColor: `${getRiskColor(getRiskLevel())}20`
              }}
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getRiskColor(getRiskLevel()) }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("w-80 h-fit bg-card/95 backdrop-blur-sm", isCollapsed && "w-14")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1 rounded bg-primary/10">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            GIS Analysis
          </CardTitle>
          <Button
            onClick={onToggleCollapsed}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Risk Level Indicator */}
        {hasAnalysisData && (
          <div className="p-3 rounded-lg border-2" style={{ 
            borderColor: getRiskColor(getRiskLevel()),
            backgroundColor: `${getRiskColor(getRiskLevel())}10`
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: getRiskColor(getRiskLevel()) }} />
                <span className="font-medium text-sm">Risk Level</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 cursor-help opacity-60 hover:opacity-100 transition-opacity" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <div className="space-y-2 text-xs">
                        <p className="font-semibold">Risk Model Calculation:</p>
                        <ul className="space-y-1 pl-2">
                          <li><strong>Critical:</strong> High-risk flood zone + (protected areas OR wetlands OR high-risk soils)</li>
                          <li><strong>High:</strong> High-risk flood zone OR high-risk soils OR (protected areas AND wetlands)</li>
                          <li><strong>Moderate:</strong> Protected areas OR wetlands OR moderate-risk soils present</li>
                          <li><strong>Low:</strong> None of the above conditions</li>
                        </ul>
                        <p className="text-muted-foreground mt-2">Soil types considered: expansive clay, organic, poor drainage, fill/disturbed, sandy/granular, loamy, bedrock</p>
                        <p className="text-muted-foreground">Based on real GIS analysis of environmental and geotechnical factors</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Badge variant="outline" style={{ 
                borderColor: getRiskColor(getRiskLevel()),
                color: getRiskColor(getRiskLevel())
              }}>
                {getRiskLevel()}
              </Badge>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger 
              value="layers" 
              className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Layers className="w-3 h-3 mr-1" />
              Layers
            </TabsTrigger>
            <TabsTrigger 
              value="export" 
              className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Download className="w-3 h-3 mr-1" />
              Export
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-200"
            >
              <Settings className="w-3 h-3 mr-1" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Layers Tab */}
          <TabsContent value="layers" className="space-y-4 mt-4">
            {currentLocation.city && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Analyzing</p>
                <p className="text-sm font-medium text-foreground">
                  {currentLocation.city}{currentLocation.state ? `, ${currentLocation.state}` : ''}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground/90">Environmental Data Layers</h4>

              {layers.map((layer) => {
                const matchesLocation = (envLayer: any) =>
                  currentLocation.city &&
                  envLayer.city?.toLowerCase() === currentLocation.city.toLowerCase() &&
                  envLayer.state === currentLocation.state;

                const candidateLayers = environmentalLayers.filter((envLayer) => {
                  if (!matchesLocation(envLayer)) return false;
                  if (layer.id === 'flood_zones') {
                    return envLayer.layer_type === 'flood_zones' || envLayer.environmental_type === 'flood_zones';
                  }
                  if (layer.id === 'protected_lands') {
                    return envLayer.environmental_type === 'protected_lands';
                  }
                  if (layer.id === 'soils_wetlands') {
                    return envLayer.environmental_type === 'soils' || envLayer.environmental_type === 'wetlands';
                  }
                  return false;
                });

                const isReal = candidateLayers.some((l) => l.metadata?.is_real_data === true);
                const hasAnyData = candidateLayers.length > 0;
                const lastUpdated = candidateLayers
                  .map((l) => l.metadata?.last_updated)
                  .filter(Boolean)
                  .sort()
                  .pop();

                return (
                  <div key={layer.id} className="space-y-2 p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Switch
                          id={layer.id}
                          checked={layer.enabled}
                          onCheckedChange={() => onToggleLayer(layer.id)}
                          disabled={isFetching}
                        />
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: layer.color }}
                          />
                          <Label htmlFor={layer.id} className="text-sm font-medium">
                            {layer.name}
                          </Label>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {hasAnyData && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0",
                              isReal
                                ? "border-green-500/40 text-green-600 dark:text-green-400"
                                : "border-amber-500/40 text-amber-600 dark:text-amber-400"
                            )}
                          >
                            {isReal ? 'Live Data' : 'Estimated'}
                          </Badge>
                        )}
                        {layer.enabled && (
                          <>
                            {layer.id.includes('flood') && <Droplets className="w-3 h-3 text-blue-500" />}
                            {layer.id.includes('protected') && <Shield className="w-3 h-3 text-green-500" />}
                          </>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground pl-6">
                      {layer.description}
                      {lastUpdated && (
                        <span className="block mt-1">
                          Updated: {new Date(lastUpdated).toLocaleDateString()}
                        </span>
                      )}
                      {isFetching && (
                        <span className="block mt-1 text-blue-600">Loading...</span>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Results Panel — full site summary after a search */}
            {hasSearched && (
              <div className="space-y-4 mt-6 border-t pt-4 max-h-[600px] overflow-y-auto pr-1">
                <h4 className="text-sm font-semibold text-foreground/90">Results</h4>

                {/* Location Summary */}
                <div className="p-3 rounded-lg bg-muted/30 space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span className="truncate">{currentLocation.displayName || `${currentLocation.city}, ${currentLocation.state}`}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentLocation.city}, {currentLocation.state}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Coordinates: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                  </p>
                  {lastAnalyzedAt && (
                    <p className="text-xs text-muted-foreground">
                      Last analyzed: {new Date(lastAnalyzedAt).toLocaleString()}
                    </p>
                  )}
                </div>

                {isFetching || !summary ? (
                  <div className="space-y-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : (
                  <>
                    {/* Flood Risk Summary */}
                    <div className="p-3 rounded-lg border bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-blue-500" />
                          <h5 className="text-sm font-medium">Flood Risk</h5>
                        </div>
                        <Badge variant="outline" className={floodBadgeClass(summary.flood.riskLevel)}>
                          {summary.flood.riskLevel}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Zones detected: {summary.flood.zoneCount}</p>
                        {summary.flood.highestZone && (
                          <p>Highest-risk zone: <span className="font-medium text-foreground">{summary.flood.highestZone}</span></p>
                        )}
                        <p>{summary.flood.explanation}</p>
                      </div>
                    </div>

                    {/* Protected Areas Summary */}
                    <div className="p-3 rounded-lg border bg-card space-y-2">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        <h5 className="text-sm font-medium">Protected Areas</h5>
                      </div>
                      {summary.protected.count === 0 ? (
                        <p className="text-xs text-muted-foreground">No protected areas in this vicinity</p>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground">
                            {summary.protected.count} found{summary.protected.closest.length > 0 ? ' — closest:' : ''}
                          </p>
                          <ul className="text-xs space-y-1">
                            {summary.protected.closest.map((p, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-muted-foreground">•</span>
                                <span>
                                  <span className="font-medium text-foreground">{p.name}</span>
                                  <span className="text-muted-foreground"> — {p.type}</span>
                                  {typeof p.distanceMiles === 'number' && (
                                    <span className="text-muted-foreground"> ({p.distanceMiles.toFixed(1)} mi)</span>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>

                    {/* Soils & Wetlands Summary */}
                    <div className="p-3 rounded-lg border bg-card space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-amber-200 dark:bg-amber-900 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-700 dark:bg-amber-300" />
                        </div>
                        <h5 className="text-sm font-medium">Soils & Wetlands</h5>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Dominant soil: <span className="text-foreground">{summary.soils.dominantSoil || 'Not detected'}</span></p>
                        <p>Wetlands present: <span className="text-foreground">{summary.soils.wetlandsPresent ? 'Yes' : 'No'}</span></p>
                        {summary.soils.wetlandsPresent && summary.soils.wetlandTypes.length > 0 && (
                          <p>
                            Types: <span className="text-foreground">{summary.soils.wetlandTypes.join(', ')}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Site Suitability Score */}
                    <div className="p-3 rounded-lg border bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium">Site Suitability Score</h5>
                        <span className="text-lg font-bold text-foreground">{summary.suitability.score}/10</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn('h-full transition-all', suitabilityBarClass(summary.suitability.color))}
                          style={{ width: `${(summary.suitability.score / 10) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Higher = more suitable for construction</p>
                    </div>

                    {/* Disaster History */}
                    <div className="p-3 rounded-lg border bg-card space-y-2">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-amber-600" />
                        <h5 className="text-sm font-medium">Federal Disaster History</h5>
                      </div>
                      {disasterHistoryLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-4/5" />
                          <Skeleton className="h-4 w-3/5" />
                        </div>
                      ) : !disasterHistory || disasterHistory.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No major federal disaster declarations found for this area
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {disasterHistory.slice(0, 5).map((d, i) => (
                            <li key={`${d.disasterNumber}_${i}`} className="text-xs flex items-start gap-2">
                              <span aria-hidden="true" className="text-base leading-none">{disasterIcon(d.incidentType)}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-medium text-foreground truncate" title={d.declarationTitle}>
                                    {d.declarationTitle || d.incidentType}
                                  </span>
                                  <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 whitespace-nowrap', disasterBadgeColor(d.incidentType))}>
                                    {d.incidentType}
                                  </Badge>
                                </div>
                                <p className="text-muted-foreground">{formatDisasterDate(d.declarationDate)}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="text-[10px] text-muted-foreground border-t pt-2 mt-2">
                        Source: FEMA OpenFEMA — Federal disaster declarations only
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Analysis Results */}
            {selectedProperty && (
              <div className="space-y-4 mt-6">
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-foreground/90 mb-3">Analysis Results</h4>
                  
                  <div className="p-3 rounded-lg bg-muted/30 mb-3">
                    <h5 className="font-medium text-sm mb-2">Selected Property</h5>
                    <p className="text-xs text-muted-foreground">
                      {selectedProperty.place.name || selectedProperty.place.formatted_address}
                    </p>
                  </div>

                  {combinedAnalysis && (
                    <div className="space-y-3">
                      {combinedAnalysis.floodZones.length > 0 && (
                        <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700">
                          <h5 className="font-medium text-sm mb-2 flex items-center gap-2 text-blue-700 dark:text-blue-400">
                            <Droplets className="w-4 h-4" />
                            FEMA Flood Zones
                          </h5>
                          <div className="text-xs space-y-1 text-blue-600 dark:text-blue-400/80">
                            {combinedAnalysis.floodZones.map((zone, index) => (
                              <div key={index} className="flex items-start gap-1">
                                <span>•</span>
                                <span>{zone}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {combinedAnalysis.protectedAreas.length > 0 && (
                        <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700">
                          <h5 className="font-medium text-sm mb-2 flex items-center gap-2 text-green-700 dark:text-green-400">
                            <Shield className="w-4 h-4" />
                            Protected Areas
                          </h5>
                          <div className="text-xs space-y-1 text-green-600 dark:text-green-400/80">
                            {combinedAnalysis.protectedAreas.map((area, index) => (
                              <div key={index} className="flex items-start gap-1">
                                <span>•</span>
                                <span>{area}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {combinedAnalysis.soilsWetlands.length > 0 && (
                        <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700">
                          <h5 className="font-medium text-sm mb-2 flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                            <div className="w-4 h-4 rounded bg-orange-200 flex items-center justify-center">
                              <div className="w-2 h-2 rounded bg-orange-600" />
                            </div>
                            Soils & Wetlands
                          </h5>
                          <div className="text-xs space-y-1 text-yellow-600 dark:text-yellow-400/80">
                            {combinedAnalysis.soilsWetlands.map((soil, index) => (
                              <div key={index} className="flex items-start gap-1">
                                <span>•</span>
                                <span>{soil}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Analysis Tab - Remove since we moved content to layers */}
          
          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Map Export */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Map Export</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <Select value={imageFormat} onValueChange={(value: 'png' | 'jpeg') => setImageFormat(value)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpeg">JPEG</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={imageQuality} onValueChange={(value: 'standard' | 'high' | 'print') => setImageQuality(value)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="high">High Quality</SelectItem>
                      <SelectItem value="print">Print Quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  onClick={handleMapImageExport}
                  disabled={isExporting || !mapInstance}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                >
                  <Image className="w-3 h-3 mr-1" />
                  Export Map Image
                </Button>
              </div>

              {/* Analysis Export */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Analysis Reports</h4>
                
                <div className="grid gap-2">
                  <Button
                    onClick={generateAnalysisReportPDF}
                    disabled={!hasSearched || !summary}
                    variant="default"
                    size="sm"
                    className="w-full text-xs justify-start"
                  >
                    <FileText className="w-3 h-3 mr-2" />
                    Export Analysis Report
                  </Button>

                  <Button
                    onClick={() => exportAnalysisAsPDF(exportData, mapInstance || undefined)}
                    disabled={isExporting || !hasAnalysisData}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs justify-start"
                  >
                    <FileText className="w-3 h-3 mr-2" />
                    Comprehensive PDF Report
                  </Button>

                  <Button
                    onClick={() => exportAnalysisAsCSV(exportData)}
                    disabled={isExporting || !hasAnalysisData}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs justify-start"
                  >
                    <File className="w-3 h-3 mr-2" />
                    Detailed CSV Data
                  </Button>
                </div>
              </div>

              {/* Export Status */}
              {isExporting && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-blue-500/10 border border-blue-500/20">
                  <div className="animate-spin w-3 h-3 border border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="text-xs text-blue-600">Generating export...</span>
                </div>
              )}

              {!hasAnalysisData && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Select and analyze a property to enable detailed exports
                </p>
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Display Options</h4>
                <div className="text-xs text-muted-foreground">
                  Map display and rendering settings will be available in a future update.
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Data Sources</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>• FEMA National Flood Hazard Layer</div>
                  <div>• USGS Protected Areas Database</div>
                  <div>• USDA NRCS Soil Survey</div>
                  <div>• USFWS National Wetlands Inventory</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Analysis Version</h4>
                <Badge variant="secondary" className="text-xs">v2.0 Enhanced</Badge>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};