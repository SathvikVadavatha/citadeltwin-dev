
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, CheckCircle, TrendingUp, Activity } from "lucide-react";
import type { Database } from '@/integrations/supabase/types';

type FEAResult = Database['public']['Tables']['fea_results']['Row'];

interface FEAResultsViewerProps {
  analysisId: string;
  results: FEAResult[];
}

export const FEAResultsViewer = ({ analysisId, results }: FEAResultsViewerProps) => {
  
  const getResultByType = (type: string) => {
    return results.find(result => result.result_type === type);
  };

  const displacementResult = getResultByType('displacement');
  const stressResult = getResultByType('stress');
  const safetyFactorResult = getResultByType('safety_factor');
  const reactionResult = getResultByType('reaction_forces');

  const formatValue = (value: number, unit: string, decimals: number = 6) => {
    if (typeof value !== 'number') return 'N/A';
    return `${value.toExponential(decimals)} ${unit}`;
  };

  const getSafetyFactorStatus = (factor: number) => {
    if (factor >= 2.0) return { color: 'text-emerald-400', icon: CheckCircle, status: 'Safe' };
    if (factor >= 1.5) return { color: 'text-yellow-400', icon: AlertTriangle, status: 'Caution' };
    return { color: 'text-red-400', icon: AlertTriangle, status: 'Unsafe' };
  };

  // Helper function to safely access JSON data
  const getJsonValue = (json: any, path: string, defaultValue: any = null) => {
    try {
      if (typeof json === 'string') {
        json = JSON.parse(json);
      }
      return json?.[path] ?? defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const getNestedJsonValue = (json: any, path1: string, path2: string, defaultValue: any = null) => {
    try {
      if (typeof json === 'string') {
        json = JSON.parse(json);
      }
      return json?.[path1]?.[path2] ?? defaultValue;
    } catch {
      return defaultValue;
    }
  };

  if (results.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Activity className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-400 text-center">
            No results available. Run the analysis to generate results.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-cyan-300 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Analysis Results
          </CardTitle>
          <CardDescription className="text-gray-400">
            Structural analysis results and safety metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Safety Factor */}
          {safetyFactorResult && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-200">Safety Factor</h4>
                {(() => {
                  const factor = getJsonValue(safetyFactorResult.data, 'value', 0);
                  const { color, icon: Icon, status } = getSafetyFactorStatus(factor);
                  return (
                    <Badge variant="outline" className={`${color} border-current`}>
                      <Icon className="w-3 h-3 mr-1" />
                      {status}
                    </Badge>
                  );
                })()}
              </div>
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-2xl font-bold text-cyan-300">
                  {getJsonValue(safetyFactorResult.data, 'value', 0)?.toFixed(2) || 'N/A'}
                </div>
                <div className="text-sm text-gray-400">
                  Ratio of material strength to applied stress
                </div>
              </div>
            </div>
          )}

          <Separator className="bg-gray-700" />

          {/* Maximum Displacement */}
          {displacementResult && (
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-200">Maximum Displacement</h4>
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-xl font-bold text-orange-300">
                  {formatValue(
                    getJsonValue(displacementResult.data, 'max', 0), 
                    getNestedJsonValue(displacementResult.metadata, 'units', '', 'm'),
                    3
                  )}
                </div>
                <div className="text-sm text-gray-400">
                  Maximum structural deformation
                </div>
              </div>
            </div>
          )}

          {/* Maximum Stress */}
          {stressResult && (
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-200">Maximum Stress</h4>
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="text-xl font-bold text-red-300">
                  {formatValue(
                    getJsonValue(stressResult.data, 'max', 0), 
                    getNestedJsonValue(stressResult.metadata, 'units', '', 'Pa'),
                    3
                  )}
                </div>
                <div className="text-sm text-gray-400">
                  Peak stress in structure
                </div>
              </div>
            </div>
          )}

          <Separator className="bg-gray-700" />

          {/* Detailed Results */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-200">Detailed Results</h4>
            
            {displacementResult && (
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="font-medium text-gray-200 mb-2">Displacement Data</div>
                <div className="text-sm text-gray-400">
                  Values: {getJsonValue(displacementResult.data, 'values', [])?.length || 0} nodes
                </div>
                <div className="text-sm text-gray-400">
                  Units: {getNestedJsonValue(displacementResult.metadata, 'units', '', 'm')}
                </div>
              </div>
            )}

            {stressResult && (
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="font-medium text-gray-200 mb-2">Stress Data</div>
                <div className="text-sm text-gray-400">
                  Values: {getJsonValue(stressResult.data, 'values', [])?.length || 0} elements
                </div>
                <div className="text-sm text-gray-400">
                  Type: {getNestedJsonValue(stressResult.metadata, 'type', '', 'von_mises')}
                </div>
                <div className="text-sm text-gray-400">
                  Units: {getNestedJsonValue(stressResult.metadata, 'units', '', 'Pa')}
                </div>
              </div>
            )}

            {reactionResult && (
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="font-medium text-gray-200 mb-2">Reaction Forces</div>
                <div className="text-sm text-gray-400">
                  Supports: {getJsonValue(reactionResult.data, 'values', [])?.length || 0}
                </div>
                <div className="text-sm text-gray-400">
                  Units: {getNestedJsonValue(reactionResult.metadata, 'units', '', 'N')}
                </div>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 pt-2">
            Results generated on: {new Date(results[0]?.created_at).toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
