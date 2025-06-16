
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Download, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  RefreshCw
} from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';

export const DataImportExportPanel: React.FC = () => {
  const { importJobs, exportJobs, startImportJob, startExportJob } = useIntegrations();
  const [importForm, setImportForm] = useState({
    source: '',
    format: 'dwg',
    sourceFileUrl: '',
  });
  const [exportForm, setExportForm] = useState({
    target: '',
    format: 'dwg',
    settings: {},
  });

  const fileFormats = [
    { value: 'dwg', label: 'AutoCAD DWG', description: 'AutoCAD Drawing files' },
    { value: 'ifc', label: 'IFC', description: 'Industry Foundation Classes' },
    { value: 'rvt', label: 'Revit RVT', description: 'Autodesk Revit files' },
    { value: 'skp', label: 'SketchUp SKP', description: 'SketchUp model files' },
    { value: 'step', label: 'STEP', description: 'Standard for Exchange of Product Data' },
    { value: 'iges', label: 'IGES', description: 'Initial Graphics Exchange Specification' },
    { value: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
    { value: 'xml', label: 'XML', description: 'Extensible Markup Language' },
    { value: 'pdf', label: 'PDF', description: 'Portable Document Format' },
    { value: 'docx', label: 'DOCX', description: 'Microsoft Word Document' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    await startImportJob({
      source: importForm.source,
      format: importForm.format as any,
      sourceFileUrl: importForm.sourceFileUrl,
      metadata: {},
    });
    setImportForm({ source: '', format: 'dwg', sourceFileUrl: '' });
  };

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    await startExportJob({
      target: exportForm.target,
      format: exportForm.format as any,
      settings: exportForm.settings,
    });
    setExportForm({ target: '', format: 'dwg', settings: {} });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Data Import & Export</h2>
        <p className="text-muted-foreground">
          Transfer data between CitadelTwin and external software
        </p>
      </div>

      <Tabs defaultValue="import" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="jobs">Job History</TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Import Data
              </CardTitle>
              <CardDescription>
                Import models and data from external software
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleImport} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source">Source System</Label>
                    <Input
                      id="source"
                      value={importForm.source}
                      onChange={(e) => setImportForm(prev => ({ ...prev, source: e.target.value }))}
                      placeholder="e.g., AutoCAD, Revit, SketchUp"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="format">File Format</Label>
                    <Select 
                      value={importForm.format} 
                      onValueChange={(value) => setImportForm(prev => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fileFormats.map((format) => (
                          <SelectItem key={format.value} value={format.value}>
                            <div>
                              <div className="font-medium">{format.label}</div>
                              <div className="text-xs text-muted-foreground">{format.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sourceFileUrl">File URL or Path</Label>
                  <Input
                    id="sourceFileUrl"
                    value={importForm.sourceFileUrl}
                    onChange={(e) => setImportForm(prev => ({ ...prev, sourceFileUrl: e.target.value }))}
                    placeholder="https://example.com/file.dwg or /path/to/file.dwg"
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Start Import
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Export Data
              </CardTitle>
              <CardDescription>
                Export your models and data to external formats
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleExport} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target">Target System</Label>
                    <Input
                      id="target"
                      value={exportForm.target}
                      onChange={(e) => setExportForm(prev => ({ ...prev, target: e.target.value }))}
                      placeholder="e.g., AutoCAD, Revit, SketchUp"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exportFormat">Export Format</Label>
                    <Select 
                      value={exportForm.format} 
                      onValueChange={(value) => setExportForm(prev => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fileFormats.map((format) => (
                          <SelectItem key={format.value} value={format.value}>
                            <div>
                              <div className="font-medium">{format.label}</div>
                              <div className="text-xs text-muted-foreground">{format.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Start Export
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Import Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {importJobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <p className="font-medium">Import from {job.source}</p>
                          <p className="text-sm text-muted-foreground">
                            {job.format.toUpperCase()} • {new Date(job.startedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.status === 'processing' && (
                          <Progress value={job.progress} className="w-24" />
                        )}
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {importJobs.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No import jobs yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Export Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exportJobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <p className="font-medium">Export to {job.target}</p>
                          <p className="text-sm text-muted-foreground">
                            {job.format.toUpperCase()} • {new Date(job.startedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.status === 'processing' && (
                          <Progress value={job.progress} className="w-24" />
                        )}
                        <Badge className={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                        {job.outputFileUrl && job.status === 'completed' && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={job.outputFileUrl} download>
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {exportJobs.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">No export jobs yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
