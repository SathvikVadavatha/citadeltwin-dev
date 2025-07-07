import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateBIMElementData } from '@/hooks/useBIMElements';
import type { Database } from '@/integrations/supabase/types';

type BIMElement = Database['public']['Tables']['bim_elements']['Row'];
type Material = Database['public']['Tables']['materials']['Row'];

interface CreateBIMElementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: CreateBIMElementData) => Promise<any>;
  materials: Material[];
  elements: BIMElement[];
  uploadId?: string;
  projectId?: string;
}

export const CreateBIMElementModal = ({
  open,
  onOpenChange,
  onCreate,
  materials,
  elements,
  uploadId,
  projectId
}: CreateBIMElementModalProps) => {
  const [formData, setFormData] = useState<CreateBIMElementData>({
    upload_id: uploadId,
    project_id: projectId,
    element_type: 'wall',
    name: '',
    description: '',
    geometry: {
      type: 'box',
      dimensions: { length: 1, width: 1, height: 1 },
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 }
    },
    parameters: {},
    material_id: undefined,
    parent_element_id: undefined
  });

  const [geometryParams, setGeometryParams] = useState({
    length: 1,
    width: 1,
    height: 1,
    x: 0,
    y: 0,
    z: 0,
    rotX: 0,
    rotY: 0,
    rotZ: 0
  });

  const [customParams, setCustomParams] = useState<Record<string, any>>({});

  const elementTypes: Database['public']['Enums']['element_type'][] = [
    'wall', 'beam', 'column', 'slab', 'door', 'window',
    'roof', 'foundation', 'stair', 'railing', 'mechanical',
    'electrical', 'plumbing', 'structural', 'architectural'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const elementData: CreateBIMElementData = {
      ...formData,
      upload_id: uploadId,
      project_id: projectId,
      geometry: {
        type: 'box',
        dimensions: {
          length: geometryParams.length,
          width: geometryParams.width,
          height: geometryParams.height
        },
        position: {
          x: geometryParams.x,
          y: geometryParams.y,
          z: geometryParams.z
        },
        rotation: {
          x: geometryParams.rotX,
          y: geometryParams.rotY,
          z: geometryParams.rotZ
        }
      },
      parameters: customParams,
      material_id: formData.material_id || undefined,
      parent_element_id: formData.parent_element_id || undefined
    };

    const result = await onCreate(elementData);
    if (result) {
      onOpenChange(false);
      // Reset form
      setFormData({
        upload_id: uploadId,
        project_id: projectId,
        element_type: 'wall',
        name: '',
        description: '',
        geometry: {
          type: 'box',
          dimensions: { length: 1, width: 1, height: 1 },
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 }
        },
        parameters: {},
        material_id: undefined,
        parent_element_id: undefined
      });
      setCustomParams({});
    }
  };

  const addCustomParam = () => {
    const paramName = prompt('Enter parameter name:');
    if (paramName && !customParams[paramName]) {
      setCustomParams(prev => ({ ...prev, [paramName]: '' }));
    }
  };

  const removeCustomParam = (paramName: string) => {
    setCustomParams(prev => {
      const newParams = { ...prev };
      delete newParams[paramName];
      return newParams;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto gradient-border">
        <DialogHeader>
          <DialogTitle className="text-xl glow-cyan">Create BIM Element</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="geometry">Geometry</TabsTrigger>
              <TabsTrigger value="parameters">Parameters</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card className="gradient-border">
                <CardHeader>
                  <CardTitle className="text-lg">Element Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="element-type">Element Type</Label>
                      <Select
                        value={formData.element_type}
                        onValueChange={(value: Database['public']['Enums']['element_type']) =>
                          setFormData(prev => ({ ...prev, element_type: value }))
                        }
                      >
                        <SelectTrigger className="cyber-button">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {elementTypes.map(type => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="cyber-button"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="cyber-button"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="material">Material</Label>
                      <Select
                        value={formData.material_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, material_id: value }))}
                      >
                        <SelectTrigger className="cyber-button">
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.map(material => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.name} ({material.material_type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="parent">Parent Element</Label>
                      <Select
                        value={formData.parent_element_id}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, parent_element_id: value }))}
                      >
                        <SelectTrigger className="cyber-button">
                          <SelectValue placeholder="Select parent" />
                        </SelectTrigger>
                        <SelectContent>
                          {elements.map(element => (
                            <SelectItem key={element.id} value={element.id}>
                              {element.name} ({element.element_type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="geometry" className="space-y-4">
              <Card className="gradient-border">
                <CardHeader>
                  <CardTitle className="text-lg">Geometry Definition</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Dimensions</Label>
                      <div className="space-y-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Length"
                          value={geometryParams.length}
                          onChange={(e) => setGeometryParams(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
                          className="cyber-button"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Width"
                          value={geometryParams.width}
                          onChange={(e) => setGeometryParams(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
                          className="cyber-button"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Height"
                          value={geometryParams.height}
                          onChange={(e) => setGeometryParams(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                          className="cyber-button"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Position</Label>
                      <div className="space-y-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="X"
                          value={geometryParams.x}
                          onChange={(e) => setGeometryParams(prev => ({ ...prev, x: parseFloat(e.target.value) || 0 }))}
                          className="cyber-button"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Y"
                          value={geometryParams.y}
                          onChange={(e) => setGeometryParams(prev => ({ ...prev, y: parseFloat(e.target.value) || 0 }))}
                          className="cyber-button"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Z"
                          value={geometryParams.z}
                          onChange={(e) => setGeometryParams(prev => ({ ...prev, z: parseFloat(e.target.value) || 0 }))}
                          className="cyber-button"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Rotation (degrees)</Label>
                      <div className="space-y-2">
                        <Input
                          type="number"
                          step="1"
                          placeholder="X Rotation"
                          value={geometryParams.rotX}
                          onChange={(e) => setGeometryParams(prev => ({ ...prev, rotX: parseFloat(e.target.value) || 0 }))}
                          className="cyber-button"
                        />
                        <Input
                          type="number"
                          step="1"
                          placeholder="Y Rotation"
                          value={geometryParams.rotY}
                          onChange={(e) => setGeometryParams(prev => ({ ...prev, rotY: parseFloat(e.target.value) || 0 }))}
                          className="cyber-button"
                        />
                        <Input
                          type="number"
                          step="1"
                          placeholder="Z Rotation"
                          value={geometryParams.rotZ}
                          onChange={(e) => setGeometryParams(prev => ({ ...prev, rotZ: parseFloat(e.target.value) || 0 }))}
                          className="cyber-button"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="parameters" className="space-y-4">
              <Card className="gradient-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Custom Parameters</CardTitle>
                  <Button type="button" onClick={addCustomParam} className="cyber-button">
                    Add Parameter
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.keys(customParams).length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No custom parameters defined. Click "Add Parameter" to add some.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(customParams).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Label className="min-w-24">{key}:</Label>
                          <Input
                            value={value}
                            onChange={(e) => setCustomParams(prev => ({ ...prev, [key]: e.target.value }))}
                            className="cyber-button flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeCustomParam(key)}
                            className="cyber-button hover:bg-destructive/20"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="cyber-button"
            >
              Cancel
            </Button>
            <Button type="submit" className="cyber-button bg-primary text-primary-foreground">
              Create Element
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
