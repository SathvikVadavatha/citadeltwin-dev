
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBuildingTemplates } from '@/hooks/useBuildingTemplates';
import { Plus, Search, Building, Settings, FileText } from 'lucide-react';

export const BuildingTemplatesPanel: React.FC = () => {
  const { templates, isLoading } = useBuildingTemplates();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(templates.map(t => t.category))];

  const getCategoryColor = (category: string) => {
    const colors = {
      residential: 'bg-green-100 text-green-800',
      commercial: 'bg-blue-100 text-blue-800',
      industrial: 'bg-orange-100 text-orange-800',
      infrastructure: 'bg-purple-100 text-purple-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-32">Loading building templates...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search building templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {template.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getCategoryColor(template.category)}>
                      {template.category}
                    </Badge>
                    <Badge variant="outline">
                      {template.building_type}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {template.description || 'No description available'}
              </p>
              
              <div className="space-y-3">
                {/* Default Parameters */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Default Parameters</span>
                  </div>
                  <div className="text-xs bg-gray-50 p-2 rounded">
                    {Object.keys(template.default_parameters).length} parameters configured
                  </div>
                </div>

                {/* Required Compliance Checks */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Compliance Checks</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {template.required_compliance_checks.slice(0, 3).map((check, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {check}
                      </Badge>
                    ))}
                    {template.required_compliance_checks.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.required_compliance_checks.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Typical Materials */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Typical Materials</span>
                  <div className="text-xs text-muted-foreground">
                    {template.typical_materials.slice(0, 3).join(', ')}
                    {template.typical_materials.length > 3 && ` +${template.typical_materials.length - 3} more`}
                  </div>
                </div>

                {/* Standard Elements */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Standard Elements</span>
                  <div className="text-xs text-muted-foreground">
                    {template.standard_elements.length} elements configured
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  Use Template
                </Button>
                <Button size="sm" variant="outline">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No building templates found matching your criteria
        </div>
      )}
    </div>
  );
};
