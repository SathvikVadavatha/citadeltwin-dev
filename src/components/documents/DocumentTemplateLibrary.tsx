import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { useDocumentTemplates } from '@/hooks/useDocumentTemplates';
import { CreateTemplateDialog } from './CreateTemplateDialog';

export const DocumentTemplateLibrary: React.FC = () => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const { templates } = useDocumentTemplates();

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
                Document Template Library
              </CardTitle>
              <CardDescription>
                Browse, filter, and create document templates used for automated generation
              </CardDescription>
            </div>
            <CreateTemplateDialog />
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
                  <SelectItem value="custom">Custom</SelectItem>
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

          {/* Templates — real rows from document_templates only; the decorative
              AI-Enhanced/Category/Jurisdiction showcase sections that used to live here
              were fabricated placeholder content with no template behind them and were
              removed rather than wired up, since nothing in the app models "AI-powered"
              or per-jurisdiction templates today. */}
          <div>
            <h3 className="text-lg font-semibold text-primary mb-3">Available Templates</h3>
            {filteredTemplates.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No templates found matching your criteria.
              </p>
            ) : (
              <div className="grid gap-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="border-border">
                    <CardContent className="p-4">
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
