
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { useDocumentTemplates, DocumentTemplate } from '@/hooks/useDocumentTemplates';
import { CreateTemplateDialog } from './CreateTemplateDialog';
import { TemplatesList } from './TemplatesList';

export const DocumentTemplateManager: React.FC = () => {
  const { templates } = useDocumentTemplates();

  const handleEdit = (template: DocumentTemplate) => {
    // TODO: Implement edit functionality
    console.log('Edit template:', template);
  };

  const handleDelete = (template: DocumentTemplate) => {
    // TODO: Implement delete functionality
    console.log('Delete template:', template);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Document Templates
              </CardTitle>
              <CardDescription>
                Manage document templates for automated generation
              </CardDescription>
            </div>
            <CreateTemplateDialog />
          </div>
        </CardHeader>
        <CardContent>
          <TemplatesList
            templates={templates}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
};
