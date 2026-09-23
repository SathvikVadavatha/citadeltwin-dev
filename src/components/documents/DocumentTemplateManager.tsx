
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FileText } from 'lucide-react';
import { useDocumentTemplates, DocumentTemplate } from '@/hooks/useDocumentTemplates';
import { CreateTemplateDialog } from './CreateTemplateDialog';
import { TemplatesList } from './TemplatesList';

export const DocumentTemplateManager: React.FC = () => {
  const { templates, deleteTemplate } = useDocumentTemplates();
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<DocumentTemplate | null>(null);

  const handleEdit = (template: DocumentTemplate) => {
    setEditingTemplate(template);
  };

  const handleDelete = (template: DocumentTemplate) => {
    setDeletingTemplate(template);
  };

  const confirmDelete = () => {
    if (!deletingTemplate) return;
    deleteTemplate.mutate(deletingTemplate.id, {
      onSuccess: () => setDeletingTemplate(null),
    });
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

      {/* Same CreateTemplateDialog component, driven into edit mode via the `template`
          prop — opened externally by a TemplateCard's Edit button rather than its own trigger. */}
      <CreateTemplateDialog
        template={editingTemplate}
        open={!!editingTemplate}
        onOpenChange={(open) => {
          if (!open) setEditingTemplate(null);
        }}
      />

      <AlertDialog
        open={!!deletingTemplate}
        onOpenChange={(open) => {
          if (!open) setDeletingTemplate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this template?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingTemplate
                ? `"${deletingTemplate.name}" will be permanently deleted. This can't be undone.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
