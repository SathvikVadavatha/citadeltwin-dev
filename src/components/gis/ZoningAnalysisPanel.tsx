
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Ruler,
  Home,
  Factory,
  Store
} from 'lucide-react';
import { useAdvancedGIS } from '@/hooks/useAdvancedGIS';

export const ZoningAnalysisPanel = () => {
  const { performZoningAnalysis, isFetching } = useAdvancedGIS();

  const [analysisParams, setAnalysisParams] = useState({
    parcelId: '',
    proposedUse: '',
    buildingHeight: 0,
    lotCoverage: 0,
    setbacks: {
      front: 0,
      rear: 0,
      side: 0
    }
  });

  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const handleZoningAnalysis = async () => {
    if (!analysisParams.parcelId || !analysisParams.proposedUse) {
      return;
    }

    try {
      const results = await performZoningAnalysis({
        parcelId: analysisParams.parcelId,
        proposedUse: analysisParams.proposedUse,
        buildingHeight: analysisParams.buildingHeight,
        lotCoverage: analysisParams.lotCoverage
      });
      setAnalysisResults(results);
    } catch (error) {
      console.error('Error performing zoning analysis:', error);
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant': return CheckCircle;
      case 'non_compliant': return XCircle;
      case 'warning': return AlertTriangle;
      default: return AlertTriangle;
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-500';
      case 'non_compliant': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getUseTypeIcon = (useType: string) => {
    switch (useType.toLowerCase()) {
      case 'residential': return Home;
      case 'commercial': return Store;
      case 'industrial': return Factory;
      default: return Building;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-purple-500" />
            Zoning Analysis & Compliance Check
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="parcel-id">Parcel ID</Label>
                <Input
                  id="parcel-id"
                  value={analysisParams.parcelId}
                  onChange={(e) => setAnalysisParams(prev => ({ ...prev, parcelId: e.target.value }))}
                  placeholder="Enter parcel ID"
                  className="cyber-button"
                />
              </div>

              <div className="space-y-2">
                <Label>Proposed Use</Label>
                <Select 
                  value={analysisParams.proposedUse} 
                  onValueChange={(value) => setAnalysisParams(prev => ({ ...prev, proposedUse: value }))}
                >
                  <SelectTrigger className="cyber-button">
                    <SelectValue placeholder="Select proposed use" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_family_residential">Single Family Residential</SelectItem>
                    <SelectItem value="multi_family_residential">Multi Family Residential</SelectItem>
                    <SelectItem value="commercial_retail">Commercial Retail</SelectItem>
                    <SelectItem value="commercial_office">Commercial Office</SelectItem>
                    <SelectItem value="industrial_light">Light Industrial</SelectItem>
                    <SelectItem value="industrial_heavy">Heavy Industrial</SelectItem>
                    <SelectItem value="mixed_use">Mixed Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="building-height">Building Height (feet)</Label>
                <Input
                  id="building-height"
                  type="number"
                  value={analysisParams.buildingHeight}
                  onChange={(e) => setAnalysisParams(prev => ({ ...prev, buildingHeight: Number(e.target.value) }))}
                  placeholder="0"
                  className="cyber-button"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lot-coverage">Lot Coverage (%)</Label>
                <Input
                  id="lot-coverage"
                  type="number"
                  value={analysisParams.lotCoverage}
                  onChange={(e) => setAnalysisParams(prev => ({ ...prev, lotCoverage: Number(e.target.value) }))}
                  placeholder="0"
                  max="100"
                  className="cyber-button"
                />
              </div>

              <div className="space-y-2">
                <Label>Setbacks (feet)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    placeholder="Front"
                    value={analysisParams.setbacks.front}
                    onChange={(e) => setAnalysisParams(prev => ({ 
                      ...prev, 
                      setbacks: { ...prev.setbacks, front: Number(e.target.value) }
                    }))}
                    className="cyber-button text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="Rear"
                    value={analysisParams.setbacks.rear}
                    onChange={(e) => setAnalysisParams(prev => ({ 
                      ...prev, 
                      setbacks: { ...prev.setbacks, rear: Number(e.target.value) }
                    }))}
                    className="cyber-button text-xs"
                  />
                  <Input
                    type="number"
                    placeholder="Side"
                    value={analysisParams.setbacks.side}
                    onChange={(e) => setAnalysisParams(prev => ({ 
                      ...prev, 
                      setbacks: { ...prev.setbacks, side: Number(e.target.value) }
                    }))}
                    className="cyber-button text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleZoningAnalysis}
            disabled={isFetching || !analysisParams.parcelId || !analysisParams.proposedUse}
            className="cyber-button w-full"
          >
            {isFetching ? 'Analyzing Zoning Compliance...' : 'Analyze Zoning Compliance'}
          </Button>

          {analysisResults && (
            <div className="space-y-4">
              <Card className="gradient-border">
                <CardHeader>
                  <CardTitle className="text-lg">Analysis Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-200 mb-3">Overall Compliance</h4>
                      <div className="flex items-center gap-3">
                        {analysisResults.overall_compliance && (() => {
                          const IconComponent = getComplianceIcon(analysisResults.overall_compliance.status);
                          const iconColor = getComplianceColor(analysisResults.overall_compliance.status);
                          return (
                            <>
                              <IconComponent className={`h-6 w-6 ${iconColor}`} />
                              <div>
                                <p className="font-medium capitalize">
                                  {analysisResults.overall_compliance.status.replace('_', ' ')}
                                </p>
                                <p className="text-sm text-gray-400">
                                  {analysisResults.overall_compliance.message}
                                </p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-200 mb-3">Zoning Information</h4>
                      <div className="space-y-2">
                        {analysisResults.zoning_info && (
                          <>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{analysisResults.zoning_info.district}</Badge>
                              <span className="text-sm text-gray-400">District</span>
                            </div>
                            <div className="text-sm text-gray-400">
                              Permitted Uses: {analysisResults.zoning_info.permitted_uses?.join(', ') || 'Not specified'}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {analysisResults.compliance_checks && (
                    <div>
                      <h4 className="font-medium text-gray-200 mb-3">Detailed Compliance Checks</h4>
                      <div className="space-y-3">
                        {analysisResults.compliance_checks.map((check: any, index: number) => {
                          const IconComponent = getComplianceIcon(check.status);
                          const iconColor = getComplianceColor(check.status);
                          
                          return (
                            <div key={index} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                              <IconComponent className={`h-5 w-5 ${iconColor} mt-0.5`} />
                              <div className="flex-1">
                                <p className="font-medium text-gray-200">{check.requirement}</p>
                                <p className="text-sm text-gray-400">{check.message}</p>
                                {check.current_value && check.required_value && (
                                  <div className="mt-2">
                                    <div className="flex items-center gap-4 text-xs">
                                      <span>Current: {check.current_value}</span>
                                      <span>Required: {check.required_value}</span>
                                    </div>
                                    {check.status === 'compliant' && (
                                      <Progress value={100} className="h-2 mt-1" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {analysisResults.recommendations && analysisResults.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-200 mb-3">Recommendations</h4>
                      <div className="space-y-2">
                        {analysisResults.recommendations.map((rec: string, index: number) => (
                          <div key={index} className="flex items-start gap-2 text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-gray-300">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
