
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Download, 
  Info, 
  Zap, 
  Building2, 
  TreePine, 
  Layers, 
  Shield,
  Database
} from 'lucide-react';
import { useStandardMaterials } from '@/hooks/useStandardMaterials';
import { ComprehensiveMaterial, MATERIAL_CATEGORIES } from '@/types/materials';

export const StandardMaterialsLibrary = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<ComprehensiveMaterial | null>(null);
  
  const {
    standardMaterials,
    loading,
    importStandardMaterial,
    importAllStandardMaterials,
    filterMaterialsByCategory,
    searchMaterials,
  } = useStandardMaterials();

  const filteredMaterials = searchQuery 
    ? searchMaterials(searchQuery)
    : selectedCategory === 'all' 
      ? standardMaterials 
      : filterMaterialsByCategory(selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'steel': return <Layers className="h-4 w-4" />;
      case 'concrete': return <Building2 className="h-4 w-4" />;
      case 'wood': return <TreePine className="h-4 w-4" />;
      case 'aluminum': return <Zap className="h-4 w-4" />;
      case 'composite': return <Shield className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      steel: 'bg-slate-500/20 text-slate-400 border-slate-400/50',
      concrete: 'bg-gray-500/20 text-muted-foreground border-gray-400/50',
      wood: 'bg-amber-500/20 text-amber-400 border-amber-400/50',
      aluminum: 'bg-blue-500/20 text-blue-600 border-blue-600/50',
      composite: 'bg-purple-500/20 text-purple-600 border-purple-600/50',
      masonry: 'bg-red-500/20 text-destructive border-destructive/50',
    };
    return colors[category] || 'bg-gray-500/20 text-muted-foreground border-gray-400/50';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold shadow-sm">Standard Materials Library</h3>
          <p className="text-muted-foreground">Import standard structural materials with verified properties</p>
        </div>
        <Button 
          onClick={importAllStandardMaterials}
          disabled={loading}
          className="skeuo-button"
        >
          <Download className="w-4 h-4 mr-2" />
          Import All Standards
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="skeuo-button pl-10"
          />
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-7 bg-card border border-border">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            All
          </TabsTrigger>
          {Object.entries(MATERIAL_CATEGORIES).map(([key, category]) => (
            <TabsTrigger 
              key={key} 
              value={key}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1"
            >
              {getCategoryIcon(key)}
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid gap-4">
            {filteredMaterials.map((material) => (
              <Card key={material.id} className="gradient-border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={getCategoryColor(material.category)}>
                        {getCategoryIcon(material.category)}
                        <span className="ml-1">{material.category}</span>
                      </Badge>
                      <div>
                        <CardTitle className="text-lg">{material.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{material.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedMaterial(material)}
                            className="skeuo-button"
                          >
                            <Info className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl gradient-border">
                          <DialogHeader>
                            <DialogTitle className="shadow-sm">{material.name} - Properties</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="h-96 w-full">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">Structural Properties</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  {Object.entries(material.structuralProperties).map(([key, prop]) => (
                                    <div key={key} className="flex justify-between">
                                      <span>{prop.name}:</span>
                                      <span>{prop.value} {prop.unit}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <Separator />
                              
                              <div>
                                <h4 className="font-semibold mb-2">Standards</h4>
                                <div className="space-y-2">
                                  {material.standards.map((standard, index) => (
                                    <Badge key={index} variant="outline">
                                      {standard.organization} {standard.specification}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              
                              <Separator />
                              
                              <div>
                                <h4 className="font-semibold mb-2">Common Uses</h4>
                                <div className="flex flex-wrap gap-2">
                                  {material.commonUses.map((use, index) => (
                                    <Badge key={index} variant="secondary">
                                      {use}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        size="sm"
                        onClick={() => importStandardMaterial(material)}
                        disabled={loading}
                        className="skeuo-button"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Import
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Category:</span>
                      <p className="font-medium">{material.subCategory || material.category}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Standards:</span>
                      <p className="font-medium">{material.standards.length} specs</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Availability:</span>
                      <p className="font-medium capitalize">{material.availability}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cost:</span>
                      <p className="font-medium">
                        ${material.costPerUnit?.toFixed(0) || 'TBD'}/unit
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredMaterials.length === 0 && (
        <Card className="gradient-border">
          <CardContent className="p-8 text-center">
            <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Materials Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or category filter.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
