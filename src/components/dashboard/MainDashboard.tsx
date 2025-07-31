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
  Settings,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { SimplifiedUploadForm } from '@/components/upload/SimplifiedUploadForm';
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
import { use3DModelViewer } from '@/hooks/use3DModelViewer';
import { CustomReportBuilder } from '@/components/analytics/CustomReportBuilder';

export const MainDashboard = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const { uploads } = useUploads();
  const { uploadResult, resetUpload } = useBlueprintUpload();
  
  const recentUpload = uploads?.[0];
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

  return (
      <div 
        className="min-h-screen p-6"
        style={{ 
          backgroundColor: 'hsl(240, 20%, 4%)', 
          color: 'hsl(224, 71%, 85%)',
          minHeight: '100vh'
        }}
      >
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
                <SimplifiedUploadForm onUploadComplete={() => {}} />
                {uploadResult ? (
                  <UploadResults 
                    uploadResult={uploadResult}
                    onReset={resetUpload}
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
              {modelLoading ? (
                <Card className="cyber-tool-palette">
                  <CardContent className="p-6 text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-cyan-400 mx-auto animate-spin" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">Loading 3D Model</h3>
                      <p className="text-gray-400">Fetching the latest generated 3D model...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : modelError ? (
                <Card className="cyber-tool-palette">
                  <CardContent className="p-6 text-center space-y-4">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">3D Model Error</h3>
                      <p className="text-gray-400 mb-4">{modelError}</p>
                      <div className="flex justify-center space-x-3">
                        <button 
                          onClick={refreshModel}
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md transition-colors flex items-center space-x-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Retry</span>
                        </button>
                        <button 
                          onClick={() => setActiveTab('upload')}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                        >
                          Upload New Blueprint
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : hasModel || uploadResult?.model3DUrl ? (
                <div className="space-y-4">
                  {modelMetadata && (
                    <Card className="cyber-tool-palette">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg text-gray-200">{modelMetadata.model_name}</CardTitle>
                            {modelMetadata.model_description && (
                              <CardDescription className="text-gray-400">{modelMetadata.model_description}</CardDescription>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="border-green-400 text-green-400">
                              {(modelMetadata.file_size / 1024 / 1024).toFixed(2)} MB
                            </Badge>
                            <button 
                              onClick={refreshModel}
                              className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                              title="Refresh model"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  )}
                  <Model3DViewer
                    modelUrl={model3DUrl || uploadResult?.model3DUrl}
                    modelName={modelMetadata?.model_name || uploadResult?.filename || 'Generated 3D Model'}
                    uploadId={targetUploadId}
                    projectId={recentUpload?.project_id}
                  />
                </div>
              ) : (
                <Card className="cyber-tool-palette">
                  <CardContent className="p-6 text-center space-y-4">
                    <Eye className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">No 3D Model Available</h3>
                      <p className="text-gray-400 mb-4">Upload a blueprint to generate and view a 3D model</p>
                      <button 
                        onClick={() => setActiveTab('upload')}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md transition-colors"
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
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <CustomReportBuilder />
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
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
