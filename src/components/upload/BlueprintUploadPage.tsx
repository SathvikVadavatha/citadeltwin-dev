
import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Image,
  Zap
} from "lucide-react";

interface BlueprintUploadPageProps {
  onNavigate: (view: string) => void;
}

export const BlueprintUploadPage = ({ onNavigate }: BlueprintUploadPageProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const supportedFormats = [
    { type: "PDF", icon: FileText, description: "Architectural drawings" },
    { type: "CAD", icon: File, description: "AutoCAD files" },
    { type: "PNG", icon: Image, description: "Image blueprints" },
    { type: "JPG", icon: Image, description: "Image blueprints" }
  ];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    setUploadedFiles(prev => [...prev, ...files]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startProcessing = () => {
    setIsProcessing(true);
    setUploadProgress(0);
    
    // Simulate processing
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsProcessing(false);
            onNavigate('projects');
          }, 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return <FileText className="h-5 w-5 text-red-500" />;
      case 'dwg':
      case 'dxf': return <File className="h-5 w-5 text-blue-500" />;
      case 'png':
      case 'jpg':
      case 'jpeg': return <Image className="h-5 w-5 text-green-500" />;
      default: return <File className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Upload Blueprint</h1>
        <p className="text-muted-foreground mt-1">
          Upload your architectural drawings and CAD files for processing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>File Upload</CardTitle>
              <CardDescription>
                Drag and drop your files or click to browse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Drop your files here
                </h3>
                <p className="text-muted-foreground mb-4">
                  or click to browse from your computer
                </p>
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button asChild variant="outline">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Browse Files
                  </label>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>Uploaded Files ({uploadedFiles.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.name)}
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing Section */}
          {uploadedFiles.length > 0 && (
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Start Processing
                </CardTitle>
                <CardDescription>
                  Begin 3D conversion and structural analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isProcessing ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Files validated and ready for processing</span>
                    </div>
                    <Button 
                      onClick={startProcessing}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Start 3D Conversion
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Processing Progress</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                    <div className="text-sm text-muted-foreground">
                      {uploadProgress < 30 && "Parsing blueprint data..."}
                      {uploadProgress >= 30 && uploadProgress < 60 && "Generating 3D model..."}
                      {uploadProgress >= 60 && uploadProgress < 90 && "Running structural analysis..."}
                      {uploadProgress >= 90 && "Finalizing project..."}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Supported Formats</CardTitle>
              <CardDescription>
                File types accepted by the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {supportedFormats.map((format, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2">
                    <format.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{format.type}</p>
                      <p className="text-xs text-muted-foreground">{format.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Processing Pipeline</CardTitle>
              <CardDescription>
                What happens after upload
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-sm">Vector Parsing</p>
                    <p className="text-xs text-muted-foreground">Extract geometric data</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-sm">3D Generation</p>
                    <p className="text-xs text-muted-foreground">Create 3D model</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-sm">FEA Analysis</p>
                    <p className="text-xs text-muted-foreground">Structural validation</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-medium">
                    4
                  </div>
                  <div>
                    <p className="font-medium text-sm">Report Generation</p>
                    <p className="text-xs text-muted-foreground">Compliance documents</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Ensure drawings are clear and high resolution</p>
                <p>• Include all relevant architectural plans</p>
                <p>• Check file size limits (max 50MB per file)</p>
                <p>• Use standard naming conventions</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
