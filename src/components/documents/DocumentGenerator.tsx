
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useDocumentTemplates } from '@/hooks/useDocumentTemplates';
import { useDocumentExports } from '@/hooks/useDocumentExports';
import { Badge } from '@/components/ui/badge';

interface DocumentGeneratorProps {
  uploadId?: string;
}

export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({ uploadId }) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [formatType, setFormatType] = useState<'pdf' | 'docx'>('pdf');
  const [generationData, setGenerationData] = useState<any>({});

  const { templates } = useDocumentTemplates();
  const { exports, generateDocument, downloadDocument } = useDocumentExports(uploadId);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const handleGenerate = () => {
    if (!selectedTemplateId || !documentTitle) return;

    generateDocument.mutate({
      templateId: selectedTemplateId,
      uploadId,
      documentType: selectedTemplate?.template_type || 'custom',
      title: documentTitle,
      formatType,
      generationData: {
        ...generationData,
        project_name: documentTitle,
        generation_timestamp: new Date().toISOString(),
      },
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'generating':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'generating':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Document Generator
          </CardTitle>
          <CardDescription>
            Generate automated documents including permit applications, structural reports, and technical documentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-select">Document Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.template_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="format-select">Format</Label>
              <Select value={formatType} onValueChange={(value: 'pdf' | 'docx') => setFormatType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="docx">Word Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="document-title">Document Title</Label>
            <Input
              id="document-title"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Enter document title"
            />
          </div>

          {selectedTemplate && (
            <div>
              <Label>Template Variables</Label>
              <div className="mt-2 space-y-3">
                {selectedTemplate.variables
                  .filter((variable: any) => variable.type === 'string' && variable.required)
                  .map((variable: any) => (
                    <div key={variable.name}>
                      <Label htmlFor={variable.name}>{variable.name.replace(/_/g, ' ')}</Label>
                      <Input
                        id={variable.name}
                        value={generationData[variable.name] || ''}
                        onChange={(e) =>
                          setGenerationData(prev => ({
                            ...prev,
                            [variable.name]: e.target.value,
                          }))
                        }
                        placeholder={`Enter ${variable.name.replace(/_/g, ' ')}`}
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!selectedTemplateId || !documentTitle || generateDocument.isPending}
            className="w-full"
          >
            {generateDocument.isPending ? 'Generating...' : 'Generate Document'}
          </Button>
        </CardContent>
      </Card>

      {/* Document Export History */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Documents</CardTitle>
          <CardDescription>
            View and download your generated documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exports.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No documents generated yet
            </p>
          ) : (
            <div className="space-y-3">
              {exports.map((exportItem) => (
                <div
                  key={exportItem.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(exportItem.status)}
                    <div>
                      <h4 className="font-medium">{exportItem.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {exportItem.document_type} • {exportItem.format_type.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(exportItem.status)}>
                      {exportItem.status}
                    </Badge>
                    {exportItem.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadDocument(exportItem.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
