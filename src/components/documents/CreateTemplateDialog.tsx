
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useDocumentTemplates, DocumentTemplate } from '@/hooks/useDocumentTemplates';

type CreateTemplateData = Omit<DocumentTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>;

export const CreateTemplateDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<CreateTemplateData>({
    name: '',
    template_type: 'custom',
    category: 'general',
    description: '',
    format_type: 'both',
    template_content: {},
    variables: [],
    is_active: true,
  });

  const { createTemplate } = useDocumentTemplates();

  const handleCreateTemplate = () => {
    createTemplate.mutate(formData, {
      onSuccess: () => {
        setIsOpen(false);
        setFormData({
          name: '',
          template_type: 'custom',
          category: 'general',
          description: '',
          format_type: 'both',
          template_content: {},
          variables: [],
          is_active: true,
        });
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Document Template</DialogTitle>
          <DialogDescription>
            Create a new template for automated document generation
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter template name"
              />
            </div>
            <div>
              <Label htmlFor="type">Template Type</Label>
              <Select
                value={formData.template_type}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, template_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permit_application">Permit Application</SelectItem>
                  <SelectItem value="structural_report">Structural Report</SelectItem>
                  <SelectItem value="technical_documentation">Technical Documentation</SelectItem>
                  <SelectItem value="compliance_report">Compliance Report</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., residential, commercial"
              />
            </div>
            <div>
              <Label htmlFor="format">Format Type</Label>
              <Select
                value={formData.format_type}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, format_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Only</SelectItem>
                  <SelectItem value="docx">Word Only</SelectItem>
                  <SelectItem value="both">Both PDF & Word</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter template description"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateTemplate} disabled={createTemplate.isPending}>
            {createTemplate.isPending ? 'Creating...' : 'Create Template'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
