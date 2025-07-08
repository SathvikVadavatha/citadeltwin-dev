
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Copy, Layers, Settings, Building2 } from 'lucide-react';
import { useBIMElements, BIMElement } from '@/hooks/useBIMElements';
import { useMaterials } from '@/hooks/useMaterials';
import { CreateBIMElementModal } from './CreateBIMElementModal';
import { MaterialsManager } from './MaterialsManager';
import { ElementConstraintsPanel } from './ElementConstraintsPanel';
import { IFCModelsManager } from '@/components/ifc/IFCModelsManager';
import { BIMElementsTable } from './BIMElementsTable';
import { toast } from 'sonner';

interface BIMElementsManagerProps {
  uploadId?: string;
  projectId?: string;
}

export const BIMElementsManager = ({ uploadId, projectId }: BIMElementsManagerProps) => {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('elements');
  
  // Use project-based filtering if projectId is provided, otherwise use upload-based
  const filterType = projectId ? 'project' : 'upload';
  const filterId = projectId || uploadId;
  
  const {
    elements,
    loading,
    creating,
    updating,
    deleting,
    createElement,
    updateElement,
    deleteElement,
    duplicateElement,
  } = useBIMElements(filterId, filterType);

  const { materials } = useMaterials();

  const handleDuplicate = async (elementId: string) => {
    await duplicateElement(elementId);
  };

  const handleDelete = async (elementId: string) => {
    if (window.confirm('Are you sure you want to delete this element?')) {
      await deleteElement(elementId);
    }
  };

  const getElementTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      wall: 'bg-blue-500/20 text-blue-400 border-blue-400/50',
      beam: 'bg-green-500/20 text-green-400 border-green-400/50',
      column: 'bg-red-500/20 text-red-400 border-red-400/50',
      slab: 'bg-purple-500/20 text-purple-400 border-purple-400/50',
      door: 'bg-yellow-500/20 text-yellow-400 border-yellow-400/50',
      window: 'bg-cyan-500/20 text-cyan-400 border-cyan-400/50',
      default: 'bg-gray-500/20 text-gray-400 border-gray-400/50',
    };
    return colors[type] || colors.default;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading BIM elements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground glow-cyan">BIM Model Manager</h2>
          <p className="text-muted-foreground">Manage parametric building elements and materials</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="cyber-button"
          disabled={creating}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Element
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
          <TabsTrigger value="elements" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Layers className="w-4 h-4 mr-2" />
            Elements
          </TabsTrigger>
          <TabsTrigger value="ifc" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Building2 className="w-4 h-4 mr-2" />
            IFC Models
          </TabsTrigger>
          <TabsTrigger value="materials" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Settings className="w-4 h-4 mr-2" />
            Materials
          </TabsTrigger>
          <TabsTrigger value="constraints" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Settings className="w-4 h-4 mr-2" />
            Constraints
          </TabsTrigger>
        </TabsList>

        <TabsContent value="elements" className="space-y-4">
          <BIMElementsTable
            elements={elements}
            onEdit={(elementId) => setSelectedElementId(elementId)}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="ifc" className="space-y-4">
          <IFCModelsManager 
            projectId={projectId}
            onElementSelect={(elementData) => {
              // Handle IFC element selection and potentially create BIM element
              console.log('IFC element selected:', elementData);
              if (elementData.classification) {
                toast.success(`Selected ${elementData.classification.category} element: ${elementData.name || elementData.type}`);
              }
            }}
          />
        </TabsContent>

        <TabsContent value="materials">
          <MaterialsManager />
        </TabsContent>

        <TabsContent value="constraints">
          <ElementConstraintsPanel elementId={selectedElementId} />
        </TabsContent>
      </Tabs>

      <CreateBIMElementModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreate={createElement}
        materials={materials || []}
        elements={elements as any || []}
        uploadId={uploadId}
        projectId={projectId}
      />
    </div>
  );
};
