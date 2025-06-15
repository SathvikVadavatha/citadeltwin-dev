
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { useDocumentTemplates, DocumentTemplate } from '@/hooks/useDocumentTemplates';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type CreateTemplateData = Omit<DocumentTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>;

export const DocumentTemplateManager: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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

  const { templates, createTemplate } = useDocumentTemplates();

  const handleCreateTemplate = () => {
    createTemplate.mutate(formData, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
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
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTemplate} disabled={createTemplate.isPending}>
                    {createTemplate.isPending ? 'Creating...' : 'Create Template'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No templates available. Create your first template to get started.
            </p>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
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
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
