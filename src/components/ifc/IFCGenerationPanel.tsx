import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Download, 
  Play, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Settings,
  FileText,
  Box
} from "lucide-react";
import { IFCJobStatus } from "./IFCJobStatus";
import { IFCGenerationOptions } from "./IFCGenerationOptions";
import { supabase } from "@/integrations/supabase/client";

interface IfcJob {
  id: string;
  status: string;
  output_file_path?: string | null;
  error_message?: string | null;
  processing_time_ms?: number | null;
  created_at: string;
  completed_at?: string | null;
  upload_id: string;
  user_id: string;
  input_data: any;
}

interface IFCGenerationPanelProps {
  uploadResult: any;
  generatingIfc: boolean;
  currentIfcJob: IfcJob | null;
  onGenerateIfc: (options?: any) => Promise<string | undefined>;
  onDownloadIfc: (job: IfcJob) => void;
  geminiAnalysis?: any;
}

export const IFCGenerationPanel: React.FC<IFCGenerationPanelProps> = ({
  uploadResult,
  generatingIfc,
  currentIfcJob,
  onGenerateIfc,
  onDownloadIfc,
  geminiAnalysis
}) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'jobs' | 'options'>('generate');
  const [allJobs, setAllJobs] = useState<IfcJob[]>([]);
  const [generationOptions, setGenerationOptions] = useState({
    buildingName: 'Generated Building',
    units: 'metric' as 'metric' | 'imperial',
    includeStructural: true,
    includeMaterials: true,
    includeSpaces: true,
    detailLevel: 'medium' as 'basic' | 'medium' | 'detailed'
  });

  // Load existing jobs
  useEffect(() => {
    const loadJobs = async () => {
      if (!uploadResult?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('ifc_generation_jobs')
          .select('*')
          .eq('upload_id', uploadResult.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAllJobs(data || []);
      } catch (error) {
        console.error('Error loading IFC jobs:', error);
      }
    };

    loadJobs();
  }, [uploadResult?.id, currentIfcJob]);

  // Real-time job updates
  useEffect(() => {
    if (!uploadResult?.id) return;

    const channel = supabase
      .channel('ifc-jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ifc_generation_jobs',
          filter: `upload_id=eq.${uploadResult.id}`
        },
        (payload) => {
          console.log('IFC job update:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            setAllJobs(prev => {
              const updated = [...prev];
              const index = updated.findIndex(job => job.id === payload.new.id);
              if (index >= 0) {
                updated[index] = payload.new as IfcJob;
              } else {
                updated.unshift(payload.new as IfcJob);
              }
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [uploadResult?.id]);

  const handleGenerate = async () => {
    try {
      await onGenerateIfc(generationOptions);
      setActiveTab('jobs');
    } catch (error) {
      console.error('IFC generation failed:', error);
    }
  };

  const hasGeminiData = geminiAnalysis || uploadResult?.geminiAnalysis;
  const canGenerate = hasGeminiData && !generatingIfc;
  const hasCompletedJobs = allJobs.some(job => job.status === 'completed');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          IFC Model Generation
          {hasCompletedJobs && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Models Available
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate">
              <Play className="h-4 w-4 mr-2" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="jobs">
              <Clock className="h-4 w-4 mr-2" />
              Jobs ({allJobs.length})
            </TabsTrigger>
            <TabsTrigger value="options">
              <Settings className="h-4 w-4 mr-2" />
              Options
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            {!hasGeminiData ? (
              <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/50">
                <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  <strong>Blueprint Analysis Required:</strong> Please ensure your blueprint has been analyzed with AI before generating IFC models. The analyzed data is needed to create accurate 3D models.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50">
                  <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    Generate industry-standard IFC (Industry Foundation Classes) 3D models from your analyzed blueprint data. The model will include structural elements, spaces, and materials based on the AI analysis.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">
                      {uploadResult.detectedObjects?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Elements Detected</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">
                      {uploadResult.floorPlanData?.rooms?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Spaces Identified</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Quick Generation Options:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Building Name:</span>
                      <span className="font-medium">{generationOptions.buildingName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Units:</span>
                      <span className="font-medium capitalize">{generationOptions.units}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Detail Level:</span>
                      <span className="font-medium capitalize">{generationOptions.detailLevel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Include Materials:</span>
                      <span className="font-medium">{generationOptions.includeMaterials ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="w-full"
                  size="lg"
                >
                  {generatingIfc ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating IFC Model...
                    </>
                  ) : (
                    <>
                      <Building2 className="h-4 w-4 mr-2" />
                      Generate IFC Model
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Generation History</h4>
              <Badge variant="outline">{allJobs.length} total jobs</Badge>
            </div>

            {allJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Box className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No IFC generation jobs yet</p>
                <p className="text-sm">Generate your first IFC model to see job history</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allJobs.map((job) => (
                  <IFCJobStatus 
                    key={job.id}
                    job={job}
                    onDownload={onDownloadIfc}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            <IFCGenerationOptions 
              options={generationOptions}
              onChange={setGenerationOptions}
              geminiAnalysis={hasGeminiData}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};