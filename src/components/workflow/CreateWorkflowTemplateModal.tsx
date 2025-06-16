
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkflowTemplates } from '@/hooks/useWorkflowTemplates';
import type { WorkflowTemplate } from '@/types/workflow';

interface CreateWorkflowTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateWorkflowTemplateModal: React.FC<CreateWorkflowTemplateModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { createTemplate } = useWorkflowTemplates();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'residential' as const,
    building_type: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const templateData: Omit<WorkflowTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'> = {
      ...formData,
      template_data: {},
      steps: [],
      automation_rules: {},
      parameters: [],
      is_active: true,
      is_system_template: false,
    };

    try {
      await createTemplate.mutateAsync(templateData);
      onOpenChange(false);
      setFormData({
        name: '',
        description: '',
        category: 'residential',
        building_type: '',
      });
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Workflow Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Template Name
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter template name"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter template description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Category
            </label>
            <Select
              value={formData.category}
              onValueChange={(value: any) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="industrial">Industrial</SelectItem>
                <SelectItem value="infrastructure">Infrastructure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="building_type" className="text-sm font-medium">
              Building Type
            </label>
            <Input
              id="building_type"
              value={formData.building_type}
              onChange={(e) => setFormData({ ...formData, building_type: e.target.value })}
              placeholder="e.g., single_family, office, warehouse"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTemplate.isPending}>
              {createTemplate.isPending ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
