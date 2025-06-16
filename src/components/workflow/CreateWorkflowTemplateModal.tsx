
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useWorkflowTemplates } from '@/hooks/useWorkflowTemplates';
import { Plus, X, ChevronUp, ChevronDown } from 'lucide-react';
import type { WorkflowStep, WorkflowParameter } from '@/types/workflow';

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
    category: 'residential' as 'residential' | 'commercial' | 'industrial' | 'infrastructure',
    building_type: '',
  });
  
  const [steps, setSteps] = useState<WorkflowStep[]>([
    { name: '', type: 'planning', automated: false, duration: '' }
  ]);
  
  const [parameters, setParameters] = useState<WorkflowParameter[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createTemplate.mutateAsync({
        ...formData,
        template_data: {},
        steps,
        automation_rules: {},
        parameters,
        is_active: true,
        is_system_template: false,
      });
      
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'residential',
      building_type: '',
    });
    setSteps([{ name: '', type: 'planning', automated: false, duration: '' }]);
    setParameters([]);
  };

  const addStep = () => {
    setSteps([...steps, { name: '', type: 'planning', automated: false, duration: '' }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, updatedStep: Partial<WorkflowStep>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updatedStep };
    setSteps(newSteps);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newSteps.length) {
      [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
      setSteps(newSteps);
    }
  };

  const addParameter = () => {
    setParameters([...parameters, {
      name: '',
      type: 'string',
      required: true,
      description: '',
    }]);
  };

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const updateParameter = (index: number, updatedParameter: Partial<WorkflowParameter>) => {
    const newParameters = [...parameters];
    newParameters[index] = { ...newParameters[index], ...updatedParameter };
    setParameters(newParameters);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Workflow Template</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Single Family Residential Workflow"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="building_type">Building Type</Label>
                  <Input
                    id="building_type"
                    value={formData.building_type}
                    onChange={(e) => setFormData({ ...formData, building_type: e.target.value })}
                    placeholder="e.g., single_family, office, warehouse"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value: any) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the purpose and scope of this workflow template"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Workflow Steps */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Workflow Steps</CardTitle>
              <Button type="button" onClick={addStep} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Step {index + 1}</span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => moveStep(index, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => moveStep(index, 'down')}
                        disabled={index === steps.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => removeStep(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Step Name</Label>
                      <Input
                        value={step.name}
                        onChange={(e) => updateStep(index, { name: e.target.value })}
                        placeholder="e.g., Initial Planning"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Input
                        value={step.duration}
                        onChange={(e) => updateStep(index, { duration: e.target.value })}
                        placeholder="e.g., 1 week, 3 days"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Step Type</Label>
                      <Select value={step.type} onValueChange={(value: any) => updateStep(index, { type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="analysis">Analysis</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="compliance">Compliance</SelectItem>
                          <SelectItem value="documentation">Documentation</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Automation</Label>
                      <Select 
                        value={step.automated ? 'true' : 'false'} 
                        onValueChange={(value) => updateStep(index, { automated: value === 'true' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">Manual</SelectItem>
                          <SelectItem value="true">Automated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Template Parameters */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Template Parameters</CardTitle>
              <Button type="button" onClick={addParameter} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Parameter
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {parameters.map((parameter, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Parameter {index + 1}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => removeParameter(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Parameter Name</Label>
                      <Input
                        value={parameter.name}
                        onChange={(e) => updateParameter(index, { name: e.target.value })}
                        placeholder="e.g., lot_size"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={parameter.type} onValueChange={(value: any) => updateParameter(index, { type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="boolean">Yes/No</SelectItem>
                          <SelectItem value="select">Selection</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Required</Label>
                      <Select 
                        value={parameter.required ? 'true' : 'false'} 
                        onValueChange={(value) => updateParameter(index, { required: value === 'true' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Required</SelectItem>
                          <SelectItem value="false">Optional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={parameter.description}
                      onChange={(e) => updateParameter(index, { description: e.target.value })}
                      placeholder="Describe what this parameter is used for"
                      required
                    />
                  </div>
                </div>
              ))}
              
              {parameters.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No parameters defined. Add parameters to make your template configurable.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
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
