import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Info,
  Edit3,
  Save,
  X,
  Link,
  Layers,
  Settings,
  Building2
} from 'lucide-react';
import { IFCElementMetadata } from '@/services/ifcClassifier';
import { BIMIFCSync } from '@/services/bimIfcSync';
import { useMaterials } from '@/hooks/useMaterials';
import { toast } from 'sonner';

interface IFCElementPropertiesPanelProps {
  element: IFCElementMetadata | null;
  onClose: () => void;
  onCreateBIMElement?: (elementData: any) => void;
  onUpdateElement?: (updates: Partial<IFCElementMetadata>) => void;
  projectId?: string;
  ifcModelId?: string;
}

export const IFCElementPropertiesPanel = ({
  element,
  onClose,
  onCreateBIMElement,
  onUpdateElement,
  projectId,
  ifcModelId
}: IFCElementPropertiesPanelProps) => {
  const [activeTab, setActiveTab] = useState('properties');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [isCreatingBIM, setIsCreatingBIM] = useState(false);
  const [linkedBIMElementId, setLinkedBIMElementId] = useState<string | null>(null);
  
  const { materials } = useMaterials();

  useEffect(() => {
    if (element) {
      setEditedName(element.name || '');
      checkForLinkedBIMElement();
    }
  }, [element]);

  const checkForLinkedBIMElement = async () => {
    if (!element?.globalId && !element?.expressID) return;
    
    const existingElement = await BIMIFCSync.findExistingElement(
      element.globalId || element.expressID.toString(),
      ifcModelId
    );
    
    if (existingElement) {
      setLinkedBIMElementId(existingElement.id);
    }
  };

  const handleSaveChanges = () => {
    if (!element) return;
    
    const updates: Partial<IFCElementMetadata> = {};
    
    if (editedName !== element.name) {
      updates.name = editedName;
    }

    if (Object.keys(updates).length > 0) {
      onUpdateElement?.(updates);
      toast.success('Element properties updated');
    }
    
    setIsEditing(false);
  };

  const handleCreateBIMElement = async () => {
    if (!element) return;
    
    setIsCreatingBIM(true);
    try {
      const elementId = await BIMIFCSync.syncElementFromIFC(element, {
        projectId,
        ifcModelId,
        autoCreateElements: true
      });
      
      if (elementId) {
        setLinkedBIMElementId(elementId);
        onCreateBIMElement?.(element);
        toast.success('BIM element created successfully');
      } else {
        toast.error('Failed to create BIM element');
      }
    } catch (error) {
      console.error('Error creating BIM element:', error);
      toast.error('Failed to create BIM element');
    } finally {
      setIsCreatingBIM(false);
    }
  };

  const getClassificationColor = (category: string) => {
    const colors: Record<string, string> = {
      structural: 'bg-blue-500/20 text-blue-400 border-blue-400/50',
      architectural: 'bg-green-500/20 text-green-400 border-green-400/50',
      mep: 'bg-purple-500/20 text-purple-400 border-purple-400/50',
      site: 'bg-orange-500/20 text-orange-400 border-orange-400/50',
      other: 'bg-gray-500/20 text-gray-400 border-gray-400/50'
    };
    return colors[category] || colors.other;
  };

  if (!element) {
    return (
      <Card className="cyber-tool-palette h-full">
        <CardContent className="p-8 text-center">
          <Info className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Element Selected</h3>
          <p className="text-muted-foreground">
            Select an element in the 3D viewer to view its properties
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cyber-tool-palette h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="w-6 h-6 text-accent" />
            <div>
              <CardTitle className="text-lg">Element Properties</CardTitle>
              <p className="text-sm text-muted-foreground">
                {element.type} • Express ID: {element.expressID}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {linkedBIMElementId && (
              <Badge variant="outline" className="text-xs border-accent text-accent">
                <Link className="w-3 h-3 mr-1" />
                Linked
              </Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
            <TabsTrigger value="properties" className="text-xs">Properties</TabsTrigger>
            <TabsTrigger value="classification" className="text-xs">Class</TabsTrigger>
            <TabsTrigger value="geometry" className="text-xs">Geometry</TabsTrigger>
            <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-3">
            <div className="space-y-3">
              <div>
                <Label htmlFor="element-name">Name</Label>
                {isEditing ? (
                  <div className="flex space-x-2">
                    <Input
                      id="element-name"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="cyber-input flex-1"
                    />
                    <Button size="sm" onClick={handleSaveChanges} className="cyber-button">
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setIsEditing(false)}
                      className="cyber-button"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{element.name || 'N/A'}</p>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setIsEditing(true)}
                      className="cyber-button"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-medium">{element.type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Global ID:</span>
                  <p className="font-medium text-xs break-all">
                    {element.globalId || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Key Properties */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Key Properties</h4>
                <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                  {Object.entries(element.properties).slice(0, 10).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground">{key}:</span>
                      <span className="font-mono">
                        {typeof value === 'object' ? JSON.stringify(value).slice(0, 30) + '...' : String(value).slice(0, 30)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="classification" className="space-y-3">
            <div className="space-y-3">
              <div>
                <span className="text-muted-foreground">Category:</span>
                <Badge className={`ml-2 ${getClassificationColor(element.classification.category)}`}>
                  {element.classification.category}
                </Badge>
              </div>

              <div>
                <span className="text-muted-foreground">Subcategory:</span>
                <p className="font-medium">{element.classification.subcategory}</p>
              </div>

              {element.classification.materials && (
                <div>
                  <span className="text-muted-foreground">Materials:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {element.classification.materials.map((material, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {material}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {element.classification.spatialLocation && (
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <div className="text-sm space-y-1">
                    {element.classification.spatialLocation.building && (
                      <p>Building: {element.classification.spatialLocation.building}</p>
                    )}
                    {element.classification.spatialLocation.storey && (
                      <p>Storey: {element.classification.spatialLocation.storey}</p>
                    )}
                    {element.classification.spatialLocation.space && (
                      <p>Space: {element.classification.spatialLocation.space}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="geometry" className="space-y-3">
            {element.classification.dimensions ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                {element.classification.dimensions.length && (
                  <div>
                    <span className="text-muted-foreground">Length:</span>
                    <p className="font-medium">{element.classification.dimensions.length.toFixed(2)}m</p>
                  </div>
                )}
                {element.classification.dimensions.width && (
                  <div>
                    <span className="text-muted-foreground">Width:</span>
                    <p className="font-medium">{element.classification.dimensions.width.toFixed(2)}m</p>
                  </div>
                )}
                {element.classification.dimensions.height && (
                  <div>
                    <span className="text-muted-foreground">Height:</span>
                    <p className="font-medium">{element.classification.dimensions.height.toFixed(2)}m</p>
                  </div>
                )}
                {element.classification.dimensions.diameter && (
                  <div>
                    <span className="text-muted-foreground">Diameter:</span>
                    <p className="font-medium">{element.classification.dimensions.diameter.toFixed(2)}m</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No dimensional data available</p>
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-3">
            {!linkedBIMElementId ? (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Create BIM Element</h4>
                <p className="text-xs text-muted-foreground">
                  Convert this IFC element to a BIM element for further editing and analysis.
                </p>
                
                {materials && materials.length > 0 && (
                  <div>
                    <Label htmlFor="material-select">Assign Material (Optional)</Label>
                    <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
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
                )}

                <Button 
                  onClick={handleCreateBIMElement}
                  disabled={isCreatingBIM}
                  className="cyber-button w-full"
                >
                  {isCreatingBIM ? (
                    <>
                      <Layers className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4 mr-2" />
                      Create BIM Element
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">BIM Integration</h4>
                <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Link className="w-4 h-4 text-accent" />
                    <span className="text-sm">Linked to BIM Element</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This IFC element is connected to BIM element {linkedBIMElementId}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};