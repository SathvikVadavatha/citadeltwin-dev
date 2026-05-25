import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Upload,
  FileText,
  Eye,
  Map,
  Shield,
  Building2,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { BlueprintUpload } from '@/components/upload/BlueprintUpload';
import { UploadResults } from '@/components/upload/UploadResults';
import { BIMElementsManager } from '@/components/bim/BIMElementsManager';
import { GISDataManager } from '@/components/gis/GISDataManager';
import { ComplianceEngine } from '@/components/compliance/ComplianceEngine';
import { DocumentGenerator } from '@/components/documents/DocumentGenerator';
import { DocumentTemplateManager } from '@/components/documents/DocumentTemplateManager';
import { useUploads } from '@/hooks/useUploads';
import { useSimplifiedUpload } from '@/hooks/useSimplifiedUpload';
import { use3DModelViewer } from '@/hooks/use3DModelViewer';
import { useDetectionRooms } from '@/hooks/useDetectionRooms';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string;
        'camera-controls'?: boolean | string;
        'auto-rotate'?: boolean | string;
        'shadow-intensity'?: string;
        exposure?: string;
        style?: React.CSSProperties;
      }, HTMLElement>;
    }
  }
}

export const MainDashboard = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const { uploads } = useUploads();
  const { result: uploadResult, reset: resetUpload } = useSimplifiedUpload();
  // liveGlbUrl: the blob URL returned directly from the pipeline for the current session.
  // This lets the model-viewer load the GLB immediately without DB polling.
  const [liveGlbUrl, setLiveGlbUrl] = useState<string | null>(null);
  const [liveGlbUploadId, setLiveGlbUploadId] = useState<string | undefined>(undefined);

  // Inject model-viewer web component script once on mount
  useEffect(() => {
    const existing = document.querySelector('script[src*="model-viewer"]');
    if (!existing) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
      document.head.appendChild(script);
    }
  }, []);

  const handleModelGenerated = (glbUrl: string, uploadId: string) => {
    setLiveGlbUrl(glbUrl);
    setLiveGlbUploadId(uploadId);
    // NOTE: auto-switch removed — navigating away loses upload state
  };
  
  const recentUpload = uploads?.[0] as any;
  const targetUploadId = uploadResult?.id || recentUpload?.id;
  
  // Use the 3D model viewer hook to fetch latest models
  const { 
    model3DUrl, 
    modelMetadata, 
    loading: modelLoading, 
    error: modelError, 
    refreshModel,
    hasModel 
  } = use3DModelViewer(targetUploadId);

  // Fetch room data from detection results for live 3D preview
  const { data: detectionRooms, isLoading: roomsLoading } = useDetectionRooms(targetUploadId);
  
  // Use rooms from uploadResult if available, otherwise from detection results
  const availableRooms = uploadResult?.enhancedRoomData || detectionRooms || [];

  // The active GLB URL — prefer the live pipeline blob, fall back to DB-fetched URL
  const activeGlbUrl = liveGlbUrl || model3DUrl;

  return (
      <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="skeuo-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-primary">
                  CitadelTwin Engineering Platform
                </CardTitle>
                <CardDescription>
                  Digital Twin Platform for Civil Engineering - Complete BIM, FEA, and Compliance Solution
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="border-primary text-primary">
                  {uploads?.length || 0} Projects
                </Badge>
                <Badge variant="outline" className="border-green-600 text-green-600 dark:border-green-400 dark:text-green-400">
                  System Online
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-muted border border-border">
            <TabsTrigger value="upload" className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </TabsTrigger>
            <TabsTrigger value="3d-viewer" className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Eye className="w-4 h-4" />
              <span>3D View</span>
            </TabsTrigger>
            <TabsTrigger value="bim" className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Building2 className="w-4 h-4" />
              <span>BIM</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="w-4 h-4" />
              <span>Compliance</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="w-4 h-4" />
              <span>Documents</span>
            </TabsTrigger>
            <TabsTrigger value="gis" className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Map className="w-4 h-4" />
              <span>GIS</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="upload" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BlueprintUpload
                  onUploadComplete={() => {}}
                  onModelGenerated={handleModelGenerated}
                />
              </div>
            </TabsContent>

            <TabsContent value="3d-viewer" className="space-y-6">
              {modelLoading && !activeGlbUrl ? (
                <Card className="skeuo-card">
                  <CardContent className="p-6 text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Loading 3D Model</h3>
                      <p className="text-muted-foreground">Fetching the latest generated 3D model...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : modelError && !activeGlbUrl ? (
                <Card className="skeuo-card">
                  <CardContent className="p-6 text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">3D Model Error</h3>
                      <p className="text-muted-foreground mb-4">{modelError}</p>
                      <div className="flex justify-center space-x-3">
                        <button
                          onClick={refreshModel}
                          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors flex items-center space-x-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Retry</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('upload')}
                          className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md transition-colors"
                        >
                          Upload New Blueprint
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : activeGlbUrl ? (
                <div className="space-y-4">
                  {modelMetadata && (
                    <Card className="skeuo-card">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{modelMetadata.model_name}</CardTitle>
                            {modelMetadata.model_description && (
                              <CardDescription>{modelMetadata.model_description}</CardDescription>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="border-green-600 text-green-600 dark:border-green-400 dark:text-green-400">
                              {(modelMetadata.file_size / 1024 / 1024).toFixed(2)} MB
                            </Badge>
                            <button
                              onClick={refreshModel}
                              className="p-2 text-muted-foreground hover:text-primary transition-colors"
                              title="Refresh model"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  )}
                  {/* model-viewer replaces Model3DViewer — no WebGL context conflict */}
                  <Card className="skeuo-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        {liveGlbUrl ? 'Pipeline 3D Model (Python CV)' : '3D Model'}
                      </CardTitle>
                      <CardDescription>
                        {liveGlbUrl
                          ? 'Generated by YOLO + EasyOCR + trimesh — drag to rotate, scroll to zoom'
                          : 'Use mouse to rotate, zoom, and pan'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div style={{ width: '100%', height: '500px' }}>
                        <model-viewer
                          src={activeGlbUrl}
                          camera-controls
                          auto-rotate
                          shadow-intensity="1"
                          style={{ width: '100%', height: '100%' }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="skeuo-card">
                  <CardContent className="p-6 text-center space-y-4">
                    <Eye className="w-12 h-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No 3D Model Available</h3>
                      <p className="text-muted-foreground mb-4">Upload a blueprint to generate and view a 3D model</p>
                      <button
                        onClick={() => setActiveTab('upload')}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors"
                      >
                        Go to Upload
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="bim" className="space-y-6">
              <BIMElementsManager />
            </TabsContent>

            <TabsContent value="compliance" className="space-y-6">
              <ComplianceEngine uploadId={uploadResult?.id || (recentUpload as any)?.id} />
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DocumentGenerator uploadId={uploadResult?.id || (recentUpload as any)?.id} />
                <DocumentTemplateManager />
              </div>
            </TabsContent>

            <TabsContent value="gis" className="space-y-6">
              <GISDataManager />
            </TabsContent>

          </div>
        </Tabs>
      </div>
    </div>
  );
};
