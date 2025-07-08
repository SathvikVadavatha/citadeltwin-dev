import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit, Trash2, Eye, Copy, Layers } from 'lucide-react';
import { BIMElement } from '@/hooks/useBIMElements';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface BIMElementsTableProps {
  elements: BIMElement[];
  onEdit?: (elementId: string) => void;
  onDelete?: (elementId: string) => void;
  onDuplicate?: (elementId: string) => void;
  onView?: (element: BIMElement) => void;
  loading?: boolean;
}

export const BIMElementsTable = ({
  elements,
  onEdit,
  onDelete,
  onDuplicate,
  onView,
  loading
}: BIMElementsTableProps) => {
  const [selectedElement, setSelectedElement] = useState<BIMElement | null>(null);

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

  const handleDelete = (elementId: string, elementName: string) => {
    if (window.confirm(`Are you sure you want to delete "${elementName}"?`)) {
      onDelete?.(elementId);
    }
  };

  if (loading) {
    return (
      <Card className="gradient-border">
        <CardContent className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading BIM elements...</p>
        </CardContent>
      </Card>
    );
  }

  if (elements.length === 0) {
    return (
      <Card className="gradient-border">
        <CardContent className="p-8 text-center">
          <Layers className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No BIM Elements</h3>
          <p className="text-muted-foreground">
            Create your first parametric building element to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="text-lg glow-cyan">BIM Elements ({elements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Dimensions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {elements.map((element) => (
                  <TableRow key={element.id} className="hover:bg-accent/10">
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-semibold">{element.name}</p>
                        {element.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-48">
                            {element.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getElementTypeColor(element.element_type)}>
                        {element.element_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {element.materials ? (
                        <div>
                          <p className="font-medium">{element.materials.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {element.materials.material_type}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {element.geometry?.dimensions ? (
                        <div className="text-sm">
                          <p>L: {element.geometry.dimensions.length || 0}m</p>
                          <p>W: {element.geometry.dimensions.width || 0}m</p>
                          <p>H: {element.geometry.dimensions.height || 0}m</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not defined</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(element.created_at), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedElement(element)}
                          className="cyber-button"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDuplicate?.(element.id)}
                          className="cyber-button"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit?.(element.id)}
                          className="cyber-button"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(element.id, element.name)}
                          className="cyber-button hover:bg-destructive/20"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Element Details Modal */}
      <Dialog open={!!selectedElement} onOpenChange={() => setSelectedElement(null)}>
        <DialogContent className="max-w-2xl gradient-border">
          <DialogHeader>
            <DialogTitle className="glow-cyan">
              {selectedElement?.name} Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedElement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Type:</strong> {selectedElement.element_type}</p>
                    <p><strong>Description:</strong> {selectedElement.description || 'None'}</p>
                    <p><strong>Created:</strong> {new Date(selectedElement.created_at).toLocaleDateString()}</p>
                    <p><strong>Updated:</strong> {new Date(selectedElement.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Material</h4>
                  {selectedElement.materials ? (
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {selectedElement.materials.name}</p>
                      <p><strong>Type:</strong> {selectedElement.materials.material_type}</p>
                      <p><strong>Properties:</strong> {Object.keys(selectedElement.materials.properties || {}).length} defined</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No material assigned</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Geometry</h4>
                {selectedElement.geometry ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Dimensions:</strong></p>
                      <ul className="ml-4">
                        <li>Length: {selectedElement.geometry.dimensions?.length || 0}m</li>
                        <li>Width: {selectedElement.geometry.dimensions?.width || 0}m</li>
                        <li>Height: {selectedElement.geometry.dimensions?.height || 0}m</li>
                      </ul>
                    </div>
                    <div>
                      <p><strong>Position:</strong></p>
                      <ul className="ml-4">
                        <li>X: {selectedElement.geometry.position?.x || 0}m</li>
                        <li>Y: {selectedElement.geometry.position?.y || 0}m</li>
                        <li>Z: {selectedElement.geometry.position?.z || 0}m</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No geometry defined</p>
                )}
              </div>

              {selectedElement.parameters && Object.keys(selectedElement.parameters).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Custom Parameters</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(selectedElement.parameters).map(([key, value]) => (
                      <div key={key}>
                        <strong>{key}:</strong> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};