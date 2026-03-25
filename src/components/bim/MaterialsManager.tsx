import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Package, Database, Library } from 'lucide-react';
import { useMaterials, CreateMaterialData } from '@/hooks/useMaterials';
import { StandardMaterialsLibrary } from '@/components/materials/StandardMaterialsLibrary';
import type { Database as DatabaseType } from '@/integrations/supabase/types';

export const MaterialsManager = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('custom');
  const [formData, setFormData] = useState<CreateMaterialData>({
    name: '',
    material_type: 'concrete',
    properties: {},
    cost_per_unit: 0,
    unit: 'm3',
    supplier: ''
  });

  const {
    materials,
    loading,
    creating,
    updating,
    deleting,
    createMaterial,
    updateMaterial,
    deleteMaterial,
  } = useMaterials();

  const materialTypes: DatabaseType['public']['Enums']['material_type'][] = [
    'concrete', 'steel', 'wood', 'glass', 'aluminum',
    'brick', 'stone', 'composite', 'insulation', 'drywall'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMaterial) {
      await updateMaterial(editingMaterial, formData);
      setEditingMaterial(null);
    } else {
      await createMaterial(formData);
    }
    
    setShowCreateModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      material_type: 'concrete',
      properties: {},
      cost_per_unit: 0,
      unit: 'm3',
      supplier: ''
    });
  };

  const handleEdit = (material: any) => {
    setFormData({
      name: material.name,
      material_type: material.material_type,
      properties: material.properties || {},
      cost_per_unit: material.cost_per_unit || 0,
      unit: material.unit || 'm3',
      supplier: material.supplier || ''
    });
    setEditingMaterial(material.id);
    setShowCreateModal(true);
  };

  const handleDelete = async (materialId: string) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      await deleteMaterial(materialId);
    }
  };

  const getMaterialTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      concrete: 'bg-gray-500/20 text-muted-foreground border-gray-400/50',
      steel: 'bg-slate-500/20 text-slate-400 border-slate-400/50',
      wood: 'bg-amber-500/20 text-amber-400 border-amber-400/50',
      glass: 'bg-blue-500/20 text-blue-600 border-blue-600/50',
      aluminum: 'bg-zinc-500/20 text-zinc-400 border-zinc-400/50',
      brick: 'bg-red-500/20 text-destructive border-destructive/50',
      stone: 'bg-stone-500/20 text-stone-400 border-stone-400/50',
      composite: 'bg-purple-500/20 text-purple-600 border-purple-600/50',
      insulation: 'bg-yellow-500/20 text-yellow-600 border-yellow-600/50',
      drywall: 'bg-neutral-500/20 text-neutral-400 border-neutral-400/50',
    };
    return colors[type] || colors.concrete;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold shadow-sm">Material Library</h3>
          <p className="text-muted-foreground">Manage building materials and their properties</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card border border-border">
          <TabsTrigger value="custom" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Package className="w-4 h-4 mr-2" />
            Custom Materials
          </TabsTrigger>
          <TabsTrigger value="standards" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Library className="w-4 h-4 mr-2" />
            Standard Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="custom" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button className="skeuo-button" onClick={() => { resetForm(); setEditingMaterial(null); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Material
                </Button>
              </DialogTrigger>
              <DialogContent className="gradient-border">
                <DialogHeader>
                  <DialogTitle className="shadow-sm">
                    {editingMaterial ? 'Edit Material' : 'Create Material'}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Material Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="skeuo-button"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Material Type</Label>
                      <Select
                        value={formData.material_type}
                        onValueChange={(value: DatabaseType['public']['Enums']['material_type']) =>
                          setFormData(prev => ({ ...prev, material_type: value }))
                        }
                      >
                        <SelectTrigger className="skeuo-button">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {materialTypes.map(type => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cost">Cost per Unit</Label>
                      <Input
                        id="cost"
                        type="number"
                        step="0.01"
                        value={formData.cost_per_unit}
                        onChange={(e) => setFormData(prev => ({ ...prev, cost_per_unit: parseFloat(e.target.value) || 0 }))}
                        className="skeuo-button"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Input
                        id="unit"
                        value={formData.unit}
                        onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                        className="skeuo-button"
                        placeholder="m3, m2, kg, etc."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supplier">Supplier</Label>
                      <Input
                        id="supplier"
                        value={formData.supplier}
                        onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                        className="skeuo-button"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                      className="skeuo-button"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={creating || updating}
                      className="skeuo-button bg-primary text-primary-foreground"
                    >
                      {editingMaterial ? 'Update' : 'Create'} Material
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {materials.length === 0 ? (
            <Card className="gradient-border">
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Custom Materials</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first material or import from the standard library.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {materials.map((material) => (
                <Card key={material.id} className="gradient-border shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge className={getMaterialTypeColor(material.material_type)}>
                          {material.material_type}
                        </Badge>
                        <div>
                          <CardTitle className="text-lg">{material.name}</CardTitle>
                          {material.supplier && (
                            <p className="text-sm text-muted-foreground">by {material.supplier}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(material)}
                          className="skeuo-button"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(material.id)}
                          disabled={deleting}
                          className="skeuo-button hover:bg-destructive/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Cost:</span>
                        <p className="font-medium">
                          ${material.cost_per_unit?.toFixed(2) || '0.00'} / {material.unit || 'unit'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Properties:</span>
                        <p className="font-medium">
                          {Object.keys(material.properties || {}).length} defined
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created:</span>
                        <p className="font-medium">
                          {new Date(material.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Updated:</span>
                        <p className="font-medium">
                          {new Date(material.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="standards">
          <StandardMaterialsLibrary />
        </TabsContent>
      </Tabs>
    </div>
  );
};
