
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Edit, Trash2 } from 'lucide-react';
import { DocumentTemplate } from '@/hooks/useDocumentTemplates';

interface TemplateCardProps {
  template: DocumentTemplate;
  onEdit?: (template: DocumentTemplate) => void;
  onDelete?: (template: DocumentTemplate) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ 
  template, 
  onEdit, 
  onDelete 
}) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'permit_application':
        return 'bg-blue-100 text-blue-800';
      case 'structural_report':
        return 'bg-green-100 text-green-800';
      case 'technical_documentation':
        return 'bg-purple-100 text-purple-800';
      case 'compliance_report':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        <FileText className="h-8 w-8 text-blue-500" />
        <div>
          <h4 className="font-medium">{template.name}</h4>
          <p className="text-sm text-muted-foreground">{template.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getTypeColor(template.template_type)}>
              {template.template_type.replace('_', ' ')}
            </Badge>
            <Badge variant="outline">{template.category}</Badge>
            <Badge variant="outline">{template.format_type}</Badge>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onEdit?.(template)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onDelete?.(template)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
