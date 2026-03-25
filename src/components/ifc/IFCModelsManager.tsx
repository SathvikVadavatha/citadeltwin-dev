import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Eye, 
  Trash2, 
  FileText,
  Download,
  Calendar
} from 'lucide-react';
import { useIFCModels, IFCModel } from '@/hooks/useIFCModels';
import { IFCUpload } from './IFCUpload';
import { IFCViewer } from './IFCViewer';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface IFCModelsManagerProps {
  projectId?: string;
  onElementSelect?: (elementData: any) => void;
}

export const IFCModelsManager = ({ projectId, onElementSelect }: IFCModelsManagerProps) => {
  const { models, loading, deleteModel, getModelUrl } = useIFCModels(projectId);
  const [selectedModel, setSelectedModel] = useState<IFCModel | null>(null);
  const [activeTab, setActiveTab] = useState('upload');

  const handleModelSelect = (model: IFCModel) => {
    setSelectedModel(model);
    setActiveTab('viewer');
    toast.success(`Loaded: ${model.name}`);
  };

  const handleModelDelete = async (model: IFCModel) => {
    if (window.confirm(`Are you sure you want to delete "${model.name}"?`)) {
      const success = await deleteModel(model.id);
      if (success && selectedModel?.id === model.id) {
        setSelectedModel(null);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading IFC models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground shadow-sm">IFC Models</h2>
          <p className="text-muted-foreground">
            Upload and view Industry Foundation Classes (IFC) building models
          </p>
        </div>
        <Badge variant="outline" className="border-accent text-accent">
          {models.length} Model{models.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
          <TabsTrigger value="upload" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="models" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <FileText className="w-4 h-4 mr-2" />
            Models ({models.length})
          </TabsTrigger>
          <TabsTrigger value="viewer" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <Eye className="w-4 h-4 mr-2" />
            Viewer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <IFCUpload 
            projectId={projectId}
            onUploadComplete={(modelId) => {
              const newModel = models.find(m => m.id === modelId);
              if (newModel) {
                handleModelSelect(newModel);
              }
            }}
          />
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          {models.length === 0 ? (
            <Card className="gradient-border">
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No IFC Models</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your first IFC model to get started with 3D building visualization.
                </p>
                <Button 
                  onClick={() => setActiveTab('upload')} 
                  className="skeuo-button"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload IFC Model
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {models.map((model) => (
                <Card key={model.id} className="gradient-border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-6 h-6 text-accent" />
                        <div>
                          <CardTitle className="text-lg">{model.name}</CardTitle>
                          {model.description && (
                            <p className="text-sm text-muted-foreground">{model.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleModelSelect(model)}
                          className="skeuo-button"
                          title="View Model"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(getModelUrl(model), '_blank')}
                          className="skeuo-button"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleModelDelete(model)}
                          className="skeuo-button hover:bg-destructive/20"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Size:</span>
                        <p className="font-medium">{formatFileSize(model.file_size)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <Badge 
                          variant={model.upload_status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {model.upload_status}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Uploaded:</span>
                        <p className="font-medium text-xs">
                          {formatDistanceToNow(new Date(model.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Project:</span>
                        <p className="font-medium text-xs">
                          {model.project_id ? 'Linked' : 'Standalone'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="viewer" className="space-y-4">
          {selectedModel ? (
            <IFCViewer
              modelUrl={getModelUrl(selectedModel)}
              modelName={selectedModel.name}
              onElementSelect={onElementSelect}
              onElementCreateBIM={(elementData) => {
                toast.success(`BIM element created from ${elementData.name || elementData.type}`);
                onElementSelect?.(elementData);
              }}
              projectId={projectId}
              ifcModelId={selectedModel.id}
            />
          ) : (
            <Card className="gradient-border">
              <CardContent className="p-8 text-center">
                <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Model Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select an IFC model from the Models tab to view it in 3D.
                </p>
                <Button 
                  onClick={() => setActiveTab('models')} 
                  className="skeuo-button"
                  disabled={models.length === 0}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Browse Models
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};