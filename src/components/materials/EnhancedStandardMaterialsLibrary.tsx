
import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ALL_ENHANCED_STANDARD_MATERIALS, ENHANCED_MATERIALS_BY_CATEGORY } from '@/data/enhancedStandardMaterials';
import { useMaterials } from '@/hooks/useMaterials';
import { Search, Download, Filter, BookOpen, Award, Leaf } from 'lucide-react';
import { toast } from 'sonner';

export const EnhancedStandardMaterialsLibrary = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStandard, setSelectedStandard] = useState<string>('all');
  const [sustainabilityFilter, setSustainabilityFilter] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  
  const { createMaterial, materials, loading } = useMaterials();

  // Get unique standards for filtering
  const availableStandards = useMemo(() => {
    const standards = new Set<string>();
    ALL_ENHANCED_STANDARD_MATERIALS.forEach(material => {
      material.standards.forEach(standard => {
        standards.add(standard.organization);
      });
    });
    return Array.from(standards).sort();
  }, []);

  // Filter materials based on search and filters
  const filteredMaterials = useMemo(() => {
    return ALL_ENHANCED_STANDARD_MATERIALS.filter(material => {
      const matchesSearch = material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.commonUses.some(use => use.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
      
      const matchesStandard = selectedStandard === 'all' || 
        material.standards.some(standard => standard.organization === selectedStandard);
      
      const matchesSustainability = sustainabilityFilter === 'all' ||
        (sustainabilityFilter === 'high-recycled' && (material.sustainability?.recycledContent || 0) > 50) ||
        (sustainabilityFilter === 'low-carbon' && (material.sustainability?.carbonFootprint || Infinity) < 5000) ||
        (sustainabilityFilter === 'recyclable' && material.sustainability?.recyclable);
      
      return matchesSearch && matchesCategory && matchesStandard && matchesSustainability;
    });
  }, [searchQuery, selectedCategory, selectedStandard, sustainabilityFilter]);

  const importMaterial = async (standardMaterial: any) => {
    try {
      // Check if material already exists
      const existingMaterial = materials.find(m => 
        m.name === standardMaterial.name && 
        m.material_type === standardMaterial.category
      );
      
      if (existingMaterial) {
        toast.error('Material already exists in your library');
        return;
      }

      // Convert to database format
      const materialData = {
        name: standardMaterial.name,
        material_type: standardMaterial.category as any,
        properties: {
          category: standardMaterial.category,
          subCategory: standardMaterial.subCategory,
          description: standardMaterial.description,
          structuralProperties: standardMaterial.structuralProperties,
          designValues: standardMaterial.designValues,
          standards: standardMaterial.standards,
          commonUses: standardMaterial.commonUses,
          limitations: standardMaterial.limitations,
          sustainability: standardMaterial.sustainability,
        },
        cost_per_unit: standardMaterial.costPerUnit,
        unit: getDefaultUnit(standardMaterial.category),
        supplier: `Standard (${standardMaterial.standards[0]?.organization || 'Generic'})`
      };

      const result = await createMaterial(materialData);
      if (result) {
        toast.success('Material imported successfully');
      }
    } catch (error) {
      console.error('Error importing material:', error);
      toast.error('Failed to import material');
    }
  };

  const getDefaultUnit = (category: string): string => {
    switch (category) {
      case 'steel':
      case 'aluminum':
        return 'kg';
      case 'concrete':
        return 'm³';
      case 'wood':
        return 'm³';
      default:
        return 'm³';
    }
  };

  const getSustainabilityScore = (material: any): string => {
    const recycled = material.sustainability?.recycledContent || 0;
    const carbon = material.sustainability?.carbonFootprint || 0;
    
    if (recycled > 70 && carbon < 1000) return 'Excellent';
    if (recycled > 50 && carbon < 5000) return 'Good';
    if (recycled > 20 || carbon < 10000) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Search and Filters */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Enhanced Materials Standards Library
            </CardTitle>
            <CardDescription>
              Comprehensive collection of engineering materials with full standards compliance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search materials, standards, or applications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="steel">Steel</SelectItem>
                  <SelectItem value="concrete">Concrete</SelectItem>
                  <SelectItem value="wood">Wood</SelectItem>
                  <SelectItem value="aluminum">Aluminum</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStandard} onValueChange={setSelectedStandard}>
                <SelectTrigger>
                  <SelectValue placeholder="Standard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Standards</SelectItem>
                  {availableStandards.map(standard => (
                    <SelectItem key={standard} value={standard}>{standard}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sustainabilityFilter} onValueChange={setSustainabilityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Sustainability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Materials</SelectItem>
                  <SelectItem value="high-recycled">High Recycled Content</SelectItem>
                  <SelectItem value="low-carbon">Low Carbon Footprint</SelectItem>
                  <SelectItem value="recyclable">Recyclable</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMaterials.map((material, index) => (
            <Card 
              key={index} 
              className={`cursor-pointer transition-colors ${
                selectedMaterial?.name === material.name ? 'border-primary' : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedMaterial(material)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{material.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {material.description}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline">
                      {material.category}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Leaf className="h-3 w-3 mr-1" />
                      {getSustainabilityScore(material)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {material.standards.slice(0, 2).map((standard, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        <Award className="h-3 w-3 mr-1" />
                        {standard.organization}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <strong>Common Uses:</strong> {material.commonUses.slice(0, 2).join(', ')}
                    {material.commonUses.length > 2 && '...'}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      ${material.costPerUnit}/unit
                    </span>
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        importMaterial(material);
                      }}
                      disabled={loading}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Import
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Material Details Panel */}
      <div className="lg:col-span-1">
        {selectedMaterial ? (
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>{selectedMaterial.name}</CardTitle>
              <CardDescription>{selectedMaterial.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="properties" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="properties">Properties</TabsTrigger>
                  <TabsTrigger value="standards">Standards</TabsTrigger>
                  <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
                </TabsList>
                
                <TabsContent value="properties" className="space-y-4">
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {Object.entries(selectedMaterial.structuralProperties).map(([key, prop]: [string, any]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="font-medium">{prop.name}:</span>
                          <span>{prop.value} {prop.unit}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="standards" className="space-y-4">
                  <div className="space-y-3">
                    {selectedMaterial.standards.map((standard: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-3">
                        <div className="font-medium">{standard.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {standard.organization} - {standard.specification}
                        </div>
                        {standard.year && (
                          <div className="text-xs text-muted-foreground">
                            Year: {standard.year}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="sustainability" className="space-y-4">
                  {selectedMaterial.sustainability ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Recycled Content:</span>
                        <span>{selectedMaterial.sustainability.recycledContent}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Recyclable:</span>
                        <span>{selectedMaterial.sustainability.recyclable ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Carbon Footprint:</span>
                        <span>{selectedMaterial.sustainability.carbonFootprint} kg CO₂</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No sustainability data available
                    </p>
                  )}
                </TabsContent>
              </Tabs>

              <Separator className="my-4" />
              
              <Button 
                className="w-full"
                onClick={() => importMaterial(selectedMaterial)}
                disabled={loading}
              >
                <Download className="h-4 w-4 mr-2" />
                Import to Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="sticky top-4">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a material to view detailed properties and standards information</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
