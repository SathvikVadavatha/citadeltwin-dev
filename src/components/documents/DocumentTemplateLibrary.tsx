import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Download, Sparkles } from 'lucide-react';
import { useDocumentTemplates } from '@/hooks/useDocumentTemplates';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface TemplateLibraryProps {
  onTemplateSelect: (templateId: string) => void;
  selectedJurisdiction?: string;
}

export const DocumentTemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onTemplateSelect,
  selectedJurisdiction
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const { templates, createTemplate } = useDocumentTemplates();

  const templateCategories = {
    residential: {
      name: 'Residential',
      icon: '🏠',
      templates: [
        'Single Family Permit Package',
        'Residential Addition Report',
        'Home Renovation Documentation'
      ]
    },
    commercial: {
      name: 'Commercial',
      icon: '🏢',
      templates: [
        'Commercial Building Permit',
        'Tenant Improvement Package',
        'Office Complex Documentation'
      ]
    },
    industrial: {
      name: 'Industrial',
      icon: '🏭',
      templates: [
        'Manufacturing Facility Report',
        'Warehouse Compliance Package',
        'Industrial Safety Documentation'
      ]
    },
    infrastructure: {
      name: 'Infrastructure',
      icon: '🛣️',
      templates: [
        'Bridge Engineering Report',
        'Road Construction Package',
        'Utility Infrastructure Documentation'
      ]
    }
  };

  const jurisdictionSpecificTemplates = {
    'OH': [
      'Ohio Snow Load Analysis Report',
      'Ohio Energy Code Compliance Package',
      'Ohio Frost Protection Documentation'
    ],
    'FL': [
      'Florida Hurricane Resistance Report',
      'Florida Coastal Construction Package',
      'Florida Flood Zone Compliance Documentation'
    ],
    'CA': [
      'California Seismic Analysis Report',
      'California Title 24 Energy Package',
      'California Accessibility Compliance'
    ]
  };

  const aiPoweredTemplates = [
    {
      name: 'AI-Enhanced Permit Application',
      description: 'Automatically generates project descriptions, code analysis, and compliance summaries',
      aiFeatures: ['Auto-generated project narrative', 'Compliance risk assessment', 'Code reference lookup']
    },
    {
      name: 'Smart Structural Report',
      description: 'AI-powered structural analysis documentation with automated calculations',
      aiFeatures: ['Automated load calculations', 'Material optimization', 'Safety factor analysis']
    },
    {
      name: 'Intelligent Presentation Deck',
      description: 'Professional client presentations with AI-optimized content and visuals',
      aiFeatures: ['Auto-generated executive summary', 'Visual optimization', 'Client-specific customization']
    }
  ];

  const filteredTemplates = templates.filter(template => {
    if (filterType !== 'all' && template.template_type !== filterType) return false;
    if (filterCategory !== 'all' && template.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Advanced Document Template Library
              </CardTitle>
              <CardDescription>
                Sophisticated templates with AI-powered content optimization for different project types and jurisdictions
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Create Advanced Document Template</DialogTitle>
                </DialogHeader>
                {/* Template creation form would go here */}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="flex gap-4">
            <div>
              <Label>Template Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="permit_application">Permit Applications</SelectItem>
                  <SelectItem value="structural_report">Structural Reports</SelectItem>
                  <SelectItem value="technical_documentation">Technical Documentation</SelectItem>
                  <SelectItem value="compliance_report">Compliance Reports</SelectItem>
                  <SelectItem value="presentation">Presentations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* AI-Powered Templates Section */}
          <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI-Enhanced Templates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aiPoweredTemplates.map((template, index) => (
                <Card key={index} className="border-cyan-500/30 bg-gradient-to-br from-cyan-900/10 to-blue-900/10">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-cyan-300">{template.name}</h4>
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                    </div>
                    <p className="text-sm text-gray-300 mb-3">{template.description}</p>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-cyan-400">AI Features:</p>
                      {template.aiFeatures.map((feature, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs mr-1 mb-1">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full mt-3 bg-cyan-600 hover:bg-cyan-700"
                      onClick={() => onTemplateSelect(`ai-${index}`)}
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Category-Based Templates */}
          <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-3">Templates by Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(templateCategories).map(([key, category]) => (
                <Card key={key} className="border-gray-700">
                  <CardContent className="p-4">
                    <div className="text-center mb-3">
                      <div className="text-2xl mb-2">{category.icon}</div>
                      <h4 className="font-medium">{category.name}</h4>
                    </div>
                    <div className="space-y-2">
                      {category.templates.map((template, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => onTemplateSelect(`${key}-${idx}`)}
                        >
                          {template}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Jurisdiction-Specific Templates */}
          {selectedJurisdiction && (
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-3">
                Jurisdiction-Specific Templates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {jurisdictionSpecificTemplates[selectedJurisdiction as keyof typeof jurisdictionSpecificTemplates]?.map((template, idx) => (
                  <Card key={idx} className="border-yellow-500/30">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-yellow-300 mb-2">{template}</h4>
                      <p className="text-xs text-gray-400 mb-3">
                        Customized for {selectedJurisdiction} specific requirements
                      </p>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => onTemplateSelect(`jurisdiction-${selectedJurisdiction}-${idx}`)}
                      >
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Existing Templates */}
          <div>
            <h3 className="text-lg font-semibold text-cyan-400 mb-3">Available Templates</h3>
            {filteredTemplates.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No templates found matching your criteria.
              </p>
            ) : (
              <div className="grid gap-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <FileText className="h-8 w-8 text-blue-500" />
                          <div>
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge>{template.template_type.replace('_', ' ')}</Badge>
                              <Badge variant="outline">{template.category}</Badge>
                              <Badge variant="outline">{template.format_type}</Badge>
                            </div>
                          </div>
                        </div>
                        <Button onClick={() => onTemplateSelect(template.id)}>
                          Select Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
