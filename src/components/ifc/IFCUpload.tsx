import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useIFCModels } from '@/hooks/useIFCModels';
import { toast } from 'sonner';

interface IFCUploadProps {
  projectId?: string;
  onUploadComplete?: (modelId: string) => void;
}

export const IFCUpload = ({ projectId, onUploadComplete }: IFCUploadProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { uploadIFCFile, uploading } = useIFCModels(projectId);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.ifc')) {
        toast.error('Please select a valid IFC file (.ifc extension required)');
        return;
      }
      
      setSelectedFile(file);
      if (!name) {
        setName(file.name.replace('.ifc', ''));
      }
    }
  }, [name]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.ifc'],
      'text/plain': ['.ifc']
    },
    multiple: false,
    maxSize: 100 * 1024 * 1024 // 100MB max
  });

  const handleUpload = async () => {
    if (!selectedFile || !name.trim()) {
      toast.error('Please select a file and provide a name');
      return;
    }

    const model = await uploadIFCFile(selectedFile, {
      project_id: projectId,
      name: name.trim(),
      description: description.trim() || undefined
    });

    if (model) {
      setSelectedFile(null);
      setName('');
      setDescription('');
      onUploadComplete?.(model.id);
    }
  };

  const handleUrlLoad = () => {
    // TODO: Implement URL-based IFC loading
    toast.info('URL loading will be implemented in a future update');
  };

  return (
    <Card className="cyber-tool-palette">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="w-5 h-5 text-accent" />
          <span>Upload IFC Model</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-accent bg-accent/10'
              : 'border-muted-foreground/30 hover:border-accent/50'
          }`}
        >
          <input {...getInputProps()} />
          {selectedFile ? (
            <div className="space-y-2">
              <FileText className="w-8 h-8 mx-auto text-accent" />
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive
                  ? 'Drop the IFC file here...'
                  : 'Drag & drop an IFC file here, or click to select'}
              </p>
              <p className="text-xs text-muted-foreground">
                Supports .ifc files up to 100MB
              </p>
            </div>
          )}
        </div>

        {/* Model Details */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="model-name">Model Name *</Label>
            <Input
              id="model-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter model name"
              className="cyber-input"
            />
          </div>
          
          <div>
            <Label htmlFor="model-description">Description</Label>
            <Textarea
              id="model-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="cyber-input min-h-[80px]"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || !name.trim() || uploading}
            className="cyber-button flex-1"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Model
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleUrlLoad}
            className="cyber-button"
          >
            Load from URL
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};