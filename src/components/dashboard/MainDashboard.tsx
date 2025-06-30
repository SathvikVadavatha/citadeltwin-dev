
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Cpu, 
  FileText, 
  Eye, 
  BarChart3, 
  Map,
  Shield,
  Zap,
  Building2,
  Settings
} from 'lucide-react';
import { BlueprintUpload } from '@/components/upload/BlueprintUpload';
import { UploadResults } from '@/components/upload/UploadResults';
import { Model3DViewer } from '@/components/3d/Model3DViewer';
import { BIMElementsManager } from '@/components/bim/BIMElementsManager';
import { FEAAnalysisManager } from '@/components/fea/FEAAnalysisManager';
import { GISDataManager } from '@/components/gis/GISDataManager';
import { ComplianceEngine } from '@/components/compliance/ComplianceEngine';
import { DocumentGenerator } from '@/components/documents/DocumentGenerator';
import { DocumentTemplateManager } from '@/components/documents/DocumentTemplateManager';
import { useUploads } from '@/hooks/useUploads';
import { useBlueprintUpload } from '@/hooks/useBlueprintUpload';

export const MainDashboard = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const { uploads } = useUploads();
  const { uploadResult, resetUpload, download3DModel } = useBlueprintUpload();

  const recentUpload = uploads?.[0];

  // Get the first available 3D model URL from upload result
  const first3DModel = uploadResult?.generated3DModels?.[0];
  const model3DUrl = first3DModel?.model_file_path ? 
    `https://fjybggorcizszcpedjbb.supabase.co/storage/v1/object/public/3d-models/${first3DModel.model_file_path}` : 
    undefined;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="cyber-ribbon border-cyan-400/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  CitadelTwin Engineering Platform
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Digital Twin Platform for Civil Engineering - Complete BIM, FEA, and Compliance Solution
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="border-cyan-400 text-cyan-400">
                  {uploads?.length || 0} Projects
                </Badge>
                <Badge variant="outline" className="border-green-400 text-green-400">
                  System Online
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8 bg-gray-900/50 border border-cyan-400/20">
            <TabsTrigger value="upload" className="flex items-center space-x-2 data-[state=active]:bg-cyan-900/50">
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </TabsTrigger>
            <TabsTrigger value="3d-viewer" className="flex items-center space-x-2 data-[state=active]:bg-cyan-900/50">
              <Eye className="w-4 h-4" />
              <span>3D View</span>
            </TabsTrigger>
            <TabsTrigger value="bim" className="flex items-center space-x-2 data-[state=active]:bg-cyan-900/50">
              <Building2 className="w-4 h-4" />
              <span>BIM</span>
            </TabsTrigger>
            <TabsTrigger value="fea" className="flex items-center space-x-2 data-[state=active]:bg-cyan-900/50">
              <Cpu className="w-4 h-4" />
              <span>FEA</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center space-x-2 data-[state=active]:bg-cyan-900/50">
              <Shield className="w-4 h-4" />
              <span>Compliance</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center space-x-2 data-[state=active]:bg-cyan-900/50">
              <FileText className="w-4 h-4" />
              <span>Documents</span>
            </TabsTrigger>
            <TabsTrigger value="gis" className="flex items-center space-x-2 data-[state=active]:bg-cyan-900/50">
              <Map className="w-4 h-4" />
              <span>GIS</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2 data-[state=active]:bg-cyan-900/50">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="upload" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BlueprintUpload onUploadComplete={() => {}} />
                {uploadResult ? (
                  <UploadResults 
                    uploadResult={uploadResult}
                    onReset={resetUpload}
                    onDownload3DModel={download3DModel}
                  />
                ) : (
                  <Card className="cyber-tool-palette">
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-400">Upload a blueprint to see analysis results</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="3d-viewer" className="space-y-6">
              <Model3DViewer 
                modelUrl={model3DUrl || (recentUpload?.id ? "/placeholder-model.glb" : undefined)} 
                modelName={first3DModel?.model_name || "Demo Model"}
                uploadId={uploadResult?.id || recentUpload?.id}
                onDownload={first3DModel ? () => download3DModel(first3DModel) : undefined}
              />
            </TabsContent>

            <TabsContent value="bim" className="space-y-6">
              <BIMElementsManager />
            </TabsContent>

            <TabsContent value="fea" className="space-y-6">
              <FEAAnalysisManager />
            </TabsContent>

            <TabsContent value="compliance" className="space-y-6">
              <ComplianceEngine uploadId={uploadResult?.id || recentUpload?.id} />
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DocumentGenerator uploadId={uploadResult?.id || recentUpload?.id} />
                <DocumentTemplateManager />
              </div>
            </TabsContent>

            <TabsContent value="gis" className="space-y-6">
              <GISDataManager />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card className="cyber-tool-palette">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                    <span>Analytics Dashboard</span>
                  </CardTitle>
                  <CardDescription>
                    Project analytics and insights coming soon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">Advanced analytics and reporting features will be available in the next update.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
