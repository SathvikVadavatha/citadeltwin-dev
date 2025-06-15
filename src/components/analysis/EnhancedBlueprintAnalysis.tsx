
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Zap, CheckCircle, AlertTriangle, FileText, Download } from "lucide-react";

interface ArchitecturalElement {
  id: string;
  type: 'wall' | 'door' | 'window' | 'column' | 'beam' | 'stair' | 'elevator' | 'room' | 'fixture';
  label: string;
  description: string;
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    area?: number;
  };
  location: {
    x: number;
    y: number;
    floor?: string;
  };
  properties: {
    material?: string;
    loadBearing?: boolean;
    structuralRole?: string;
    compliance?: string[];
  };
  confidence: number;
}

interface StructuralAnalysis {
  loadBearingElements: ArchitecturalElement[];
  structuralSystem: string;
  foundationType: string;
  seismicConsiderations: string[];
  codeCompliance: {
    building: string[];
    fire: string[];
    accessibility: string[];
  };
  recommendations: string[];
}

interface TechnicalInsights {
  buildingType: string;
  constructionMethod: string;
  estimatedArea: number;
  floorCount: number;
  occupancyType: string;
  energyEfficiencyNotes: string[];
  sustainabilityFeatures: string[];
  potentialIssues: string[];
}

interface GeminiAnalysisResult {
  architecturalElements: ArchitecturalElement[];
  structuralAnalysis: StructuralAnalysis;
  technicalInsights: TechnicalInsights;
  engineeringDescription: string;
  processingTime: number;
}

interface EnhancedBlueprintAnalysisProps {
  analysisResult: GeminiAnalysisResult;
  imageUrl: string;
  onGenerateReport: () => void;
}

export const EnhancedBlueprintAnalysis: React.FC<EnhancedBlueprintAnalysisProps> = ({
  analysisResult,
  imageUrl,
  onGenerateReport
}) => {
  const getElementTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'wall': 'bg-blue-100 text-blue-800',
      'door': 'bg-green-100 text-green-800',
      'window': 'bg-yellow-100 text-yellow-800',
      'column': 'bg-purple-100 text-purple-800',
      'beam': 'bg-red-100 text-red-800',
      'room': 'bg-indigo-100 text-indigo-800',
      'fixture': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Enhanced Gemini AI Blueprint Analysis
          <Badge variant="secondary">
            {analysisResult.processingTime}ms
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="elements" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="elements">Elements</TabsTrigger>
            <TabsTrigger value="structural">Structural</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="description">Description</TabsTrigger>
          </TabsList>

          <TabsContent value="elements" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold mb-3">Architectural Elements ({analysisResult.architecturalElements.length})</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {analysisResult.architecturalElements.map((element) => (
                    <div key={element.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getElementTypeColor(element.type)}>
                          {element.type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {(element.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <h4 className="font-medium">{element.label}</h4>
                      <p className="text-sm text-muted-foreground">{element.description}</p>
                      {element.dimensions.area && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Area: {element.dimensions.area.toFixed(1)} sq ft
                        </p>
                      )}
                      {element.properties.material && (
                        <p className="text-xs text-muted-foreground">
                          Material: {element.properties.material}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Blueprint Preview</h3>
                <div className="relative">
                  <img 
                    src={imageUrl} 
                    alt="Blueprint" 
                    className="w-full h-64 object-contain border rounded-lg bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="structural" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Structural Analysis
                </h3>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium">Structural System</h4>
                    <p className="text-sm text-muted-foreground">{analysisResult.structuralAnalysis.structuralSystem}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium">Foundation Type</h4>
                    <p className="text-sm text-muted-foreground">{analysisResult.structuralAnalysis.foundationType}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium">Load-Bearing Elements</h4>
                    <p className="text-sm text-muted-foreground">
                      {analysisResult.structuralAnalysis.loadBearingElements.length} identified
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Code Compliance</h3>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Building Code
                    </h4>
                    <ul className="text-sm text-muted-foreground mt-1">
                      {analysisResult.structuralAnalysis.codeCompliance.building.map((item, index) => (
                        <li key={index}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Recommendations
                    </h4>
                    <ul className="text-sm text-muted-foreground mt-1">
                      {analysisResult.structuralAnalysis.recommendations.map((item, index) => (
                        <li key={index}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold mb-3">Technical Insights</h3>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium">Building Classification</h4>
                    <p className="text-sm text-muted-foreground">{analysisResult.technicalInsights.buildingType}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium">Construction Method</h4>
                    <p className="text-sm text-muted-foreground">{analysisResult.technicalInsights.constructionMethod}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium">Estimated Area</h4>
                    <p className="text-sm text-muted-foreground">{analysisResult.technicalInsights.estimatedArea.toLocaleString()} sq ft</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium">Occupancy Type</h4>
                    <p className="text-sm text-muted-foreground">{analysisResult.technicalInsights.occupancyType}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Sustainability & Efficiency</h3>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium">Energy Efficiency</h4>
                    <ul className="text-sm text-muted-foreground mt-1">
                      {analysisResult.technicalInsights.energyEfficiencyNotes.map((note, index) => (
                        <li key={index}>• {note}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium">Sustainability Features</h4>
                    <ul className="text-sm text-muted-foreground mt-1">
                      {analysisResult.technicalInsights.sustainabilityFeatures.map((feature, index) => (
                        <li key={index}>• {feature}</li>
                      ))}
                    </ul>
                  </div>
                  {analysisResult.technicalInsights.potentialIssues.length > 0 && (
                    <div className="p-3 border rounded-lg border-orange-200 bg-orange-50">
                      <h4 className="font-medium text-orange-800">Potential Issues</h4>
                      <ul className="text-sm text-orange-700 mt-1">
                        {analysisResult.technicalInsights.potentialIssues.map((issue, index) => (
                          <li key={index}>• {issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="description" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Engineering Description
              </h3>
              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {analysisResult.engineeringDescription}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onGenerateReport} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Generate Technical Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
