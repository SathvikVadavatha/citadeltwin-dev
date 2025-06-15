
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle, Info, Zap, Building, Hammer, FileText, Brain } from "lucide-react";

interface EnhancedBlueprintAnalysisProps {
  analysisResult: any;
  imageUrl: string;
  onGenerateReport?: () => void;
}

export const EnhancedBlueprintAnalysis: React.FC<EnhancedBlueprintAnalysisProps> = ({
  analysisResult,
  imageUrl,
  onGenerateReport
}) => {
  const getElementTypeIcon = (type: string) => {
    switch (type) {
      case 'wall': return '🧱';
      case 'door': return '🚪';
      case 'window': return '🪟';
      case 'column': return '🏛️';
      case 'beam': return '⚡';
      case 'stair': return '🪜';
      case 'room': return '🏠';
      default: return '📐';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500/10 text-green-400 border-green-500/20';
    if (confidence >= 0.6) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    return 'bg-red-500/10 text-red-400 border-red-500/20';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Advanced Blueprint Analysis
            <Badge variant="outline" className="ml-auto">
              Gemini AI Enhanced
            </Badge>
          </CardTitle>
          <CardDescription>
            Comprehensive architectural and engineering analysis powered by Gemini AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {analysisResult.architecturalElements.length}
              </div>
              <div className="text-sm text-muted-foreground">Elements Identified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {analysisResult.structuralAnalysis.loadBearingElements.length}
              </div>
              <div className="text-sm text-muted-foreground">Load-Bearing Elements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {(analysisResult.processingTime / 1000).toFixed(1)}s
              </div>
              <div className="text-sm text-muted-foreground">Analysis Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="elements" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="elements">Elements</TabsTrigger>
          <TabsTrigger value="structural">Structural</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="description">Description</TabsTrigger>
        </TabsList>

        {/* Architectural Elements */}
        <TabsContent value="elements">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Architectural Elements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {analysisResult.architecturalElements.map((element: any, index: number) => (
                  <div key={element.id || index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getElementTypeIcon(element.type)}</span>
                        <div>
                          <h4 className="font-semibold">{element.label}</h4>
                          <p className="text-sm text-muted-foreground">{element.description}</p>
                        </div>
                      </div>
                      <Badge className={getConfidenceColor(element.confidence)}>
                        {(element.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    
                    {element.dimensions && Object.keys(element.dimensions).length > 0 && (
                      <div className="text-sm space-y-1">
                        <div className="font-medium">Dimensions:</div>
                        <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                          {element.dimensions.length && (
                            <span>Length: {element.dimensions.length}ft</span>
                          )}
                          {element.dimensions.width && (
                            <span>Width: {element.dimensions.width}ft</span>
                          )}
                          {element.dimensions.height && (
                            <span>Height: {element.dimensions.height}ft</span>
                          )}
                          {element.dimensions.area && (
                            <span>Area: {element.dimensions.area.toFixed(1)}sq ft</span>
                          )}
                        </div>
                      </div>
                    )}

                    {element.properties && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {element.properties.material && (
                          <Badge variant="outline">{element.properties.material}</Badge>
                        )}
                        {element.properties.loadBearing && (
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-400">
                            Load-Bearing
                          </Badge>
                        )}
                        {element.properties.structuralRole && (
                          <Badge variant="outline">{element.properties.structuralRole}</Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Structural Analysis */}
        <TabsContent value="structural">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hammer className="h-5 w-5" />
                Structural Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Structural System</h4>
                <p className="text-muted-foreground">{analysisResult.structuralAnalysis.structuralSystem}</p>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Foundation Type</h4>
                <p className="text-muted-foreground">{analysisResult.structuralAnalysis.foundationType}</p>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Code Compliance</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Building Code</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      {analysisResult.structuralAnalysis.codeCompliance.building.map((item: string, index: number) => (
                        <div key={index} className="text-sm text-muted-foreground">• {item}</div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">Fire Safety</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      {analysisResult.structuralAnalysis.codeCompliance.fire.map((item: string, index: number) => (
                        <div key={index} className="text-sm text-muted-foreground">• {item}</div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Info className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Accessibility</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      {analysisResult.structuralAnalysis.codeCompliance.accessibility.map((item: string, index: number) => (
                        <div key={index} className="text-sm text-muted-foreground">• {item}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {analysisResult.structuralAnalysis.recommendations.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Engineering Recommendations</h4>
                    <div className="space-y-1">
                      {analysisResult.structuralAnalysis.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="text-sm text-muted-foreground">• {rec}</div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical Insights */}
        <TabsContent value="insights">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Technical Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Building Classification</h4>
                  <p className="text-muted-foreground">{analysisResult.technicalInsights.buildingType}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Construction Method</h4>
                  <p className="text-muted-foreground">{analysisResult.technicalInsights.constructionMethod}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Estimated Area</h4>
                  <p className="text-muted-foreground">{analysisResult.technicalInsights.estimatedArea.toLocaleString()} sq ft</p>
                </div>
                <div>
                  <h4 className="font-semibold">Occupancy Type</h4>
                  <p className="text-muted-foreground">{analysisResult.technicalInsights.occupancyType}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Energy Efficiency Notes</h4>
                  <div className="space-y-1">
                    {analysisResult.technicalInsights.energyEfficiencyNotes.map((note: string, index: number) => (
                      <div key={index} className="text-sm text-muted-foreground">• {note}</div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Sustainability Features</h4>
                  <div className="space-y-1">
                    {analysisResult.technicalInsights.sustainabilityFeatures.map((feature: string, index: number) => (
                      <div key={index} className="text-sm text-muted-foreground">• {feature}</div>
                    ))}
                  </div>
                </div>

                {analysisResult.technicalInsights.potentialIssues.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Potential Issues
                    </h4>
                    <div className="space-y-1">
                      {analysisResult.technicalInsights.potentialIssues.map((issue: string, index: number) => (
                        <div key={index} className="text-sm text-orange-400">• {issue}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engineering Description */}
        <TabsContent value="description">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Engineering Description
              </CardTitle>
              <CardDescription>
                Detailed technical description suitable for engineering documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {analysisResult.engineeringDescription}
                  </pre>
                </div>
              </div>
              
              {onGenerateReport && (
                <div className="mt-4">
                  <Button onClick={onGenerateReport} className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Technical Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
