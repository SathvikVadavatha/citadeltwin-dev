
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingStates';
import { DocumentTemplate } from '@/hooks/useOptimizedDocumentTemplates';

interface DocumentGeneratorFormProps {
  templates: DocumentTemplate[];
  onGenerate: (data: {
    templateId: string;
    title: string;
    formatType: 'pdf' | 'docx';
    generationData: any;
  }) => void;
  isGenerating: boolean;
}

export const DocumentGeneratorForm: React.FC<DocumentGeneratorFormProps> = ({
  templates,
  onGenerate,
  isGenerating
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [formatType, setFormatType] = useState<'pdf' | 'docx'>('pdf');
  const [generationData, setGenerationData] = useState<any>({});
  const [validationError, setValidationError] = useState<string>('');

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const validateForm = useCallback((): boolean => {
    setValidationError('');
    
    if (!selectedTemplateId) {
      setValidationError('Please select a document template');
      return false;
    }
    
    if (!documentTitle.trim()) {
      setValidationError('Please enter a document title');
      return false;
    }
    
    if (documentTitle.trim().length < 3) {
      setValidationError('Document title must be at least 3 characters long');
      return false;
    }
    
    if (selectedTemplate?.variables) {
      const missingFields = selectedTemplate.variables
        .filter((variable: any) => variable.required && variable.type === 'string')
        .filter((variable: any) => !generationData[variable.name]?.trim())
        .map((variable: any) => variable.name.replace(/_/g, ' '));
      
      if (missingFields.length > 0) {
        setValidationError(`Please fill in the following required fields: ${missingFields.join(', ')}`);
        return false;
      }
    }
    
    return true;
  }, [selectedTemplateId, documentTitle, selectedTemplate?.variables, generationData]);

  const handleSubmit = useCallback(() => {
    if (!validateForm()) return;

    onGenerate({
      templateId: selectedTemplateId,
      title: documentTitle.trim(),
      formatType,
      generationData: {
        ...generationData,
        project_name: documentTitle.trim(),
        generation_timestamp: new Date().toISOString(),
      }
    });

    // Clear form after successful generation
    setDocumentTitle('');
    setGenerationData({});
    setSelectedTemplateId('');
  }, [validateForm, onGenerate, selectedTemplateId, documentTitle, formatType, generationData]);

  const handleVariableChange = useCallback((variableName: string, value: string) => {
    setGenerationData(prev => ({
      ...prev,
      [variableName]: value,
    }));
  }, []);

  return (
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
        {validationError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

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
          <Label htmlFor="document-title">Document Title *</Label>
          <Input
            id="document-title"
            value={documentTitle}
            onChange={(e) => setDocumentTitle(e.target.value)}
            placeholder="Enter document title (minimum 3 characters)"
            className={validationError && !documentTitle.trim() ? 'border-red-500' : ''}
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
                    <Label htmlFor={variable.name}>
                      {variable.name.replace(/_/g, ' ')} *
                    </Label>
                    <Input
                      id={variable.name}
                      value={generationData[variable.name] || ''}
                      onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                      placeholder={`Enter ${variable.name.replace(/_/g, ' ')}`}
                      className={validationError && !generationData[variable.name]?.trim() ? 'border-red-500' : ''}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!selectedTemplateId || !documentTitle || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <LoadingSpinner variant="inline" size="sm" text="Generating Document..." />
          ) : (
            'Generate Document'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
