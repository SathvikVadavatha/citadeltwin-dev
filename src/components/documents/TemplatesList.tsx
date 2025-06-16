
import React from 'react';
import { TemplateCard } from './TemplateCard';
import { DocumentTemplate } from '@/hooks/useDocumentTemplates';

interface TemplatesListProps {
  templates: DocumentTemplate[];
  onEdit?: (template: DocumentTemplate) => void;
  onDelete?: (template: DocumentTemplate) => void;
}

export const TemplatesList: React.FC<TemplatesListProps> = ({ 
  templates, 
  onEdit, 
  onDelete 
}) => {
  if (templates.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No templates available. Create your first template to get started.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
