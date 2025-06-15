import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Link, ToggleLeft, ToggleRight } from 'lucide-react';
import { useElementConstraints, CreateConstraintData } from '@/hooks/useElementConstraints';
import { useBIMElements } from '@/hooks/useBIMElements';
import type { Database } from '@/integrations/supabase/types';

interface ElementConstraintsPanelProps {
  elementId: string | null;
}

export const ElementConstraintsPanel = ({ elementId }: ElementConstraintsPanelProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<CreateConstraintData>({
    element_id: '',
    constraint_type: 'dimensional',
    constraint_data: {},
    target_element_id: '',
    is_active: true
  });

  const {
    constraints,
    loading,
    creating,
    updating,
    deleting,
    createConstraint,
    updateConstraint,
    deleteConstraint,
    toggleConstraint,
  } = useElementConstraints(elementId || undefined);

  const { elements } = useBIMElements();

  const constraintTypes: Database['public']['Enums']['constraint_type'][] = [
    'dimensional', 'geometric', 'material', 'structural', 'thermal'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!elementId) return;

    const constraintData: CreateConstraintData = {
      ...formData,
      element_id: elementId,
      target_element_id: formData.target_element_id || undefined
    };

    const result = await createConstraint(constraintData);
    if (result) {
      setShowCreateModal(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      element_id: '',
      constraint_type: 'dimensional',
      constraint_data: {},
      target_element_id: '',
      is_active: true
    });
  };

  const handleDelete = async (constraintId: string) => {
    if (window.confirm('Are you sure you want to delete this constraint?')) {
      await deleteConstraint(constraintId);
    }
  };

  const getConstraintTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      dimensional: 'bg-blue-500/20 text-blue-400 border-blue-400/50',
      geometric: 'bg-green-500/20 text-green-400 border-green-400/50',
      material: 'bg-purple-500/20 text-purple-400 border-purple-400/50',
      structural: 'bg-red-500/20 text-red-400 border-red-400/50',
      thermal: 'bg-orange-500/20 text-orange-400 border-orange-400/50',
    };
    return colors[type] || colors.dimensional;
  };

  if (!elementId) {
    return (
      <Card className="gradient-border">
        <CardContent className="p-8 text-center">
          <Link className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Element Selected</h3>
          <p className="text-muted-foreground">
            Select an element from the Elements tab to view and manage its constraints.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading constraints...</p>
        </div>
      </div>
    );
  }

  const selectedElement = elements.find(el => el.id === elementId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold glow-cyan">Element Constraints</h3>
          <p className="text-muted-foreground">
            Managing constraints for: <span className="text-primary">{selectedElement?.name}</span>
          </p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className="cyber-button" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Constraint
            </Button>
          </DialogTrigger>
          <DialogContent className="gradient-border">
            <DialogHeader>
              <DialogTitle className="glow-cyan">Create Constraint</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="constraint-type">Constraint Type</Label>
                <Select
                  value={formData.constraint_type}
                  onValueChange={(value: Database['public']['Enums']['constraint_type']) =>
                    setFormData(prev => ({ ...prev, constraint_type: value }))
                  }
                >
                  <SelectTrigger className="cyber-button">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {constraintTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-element">Target Element (Optional)</Label>
                <Select
                  value={formData.target_element_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, target_element_id: value }))}
                >
                  <SelectTrigger className="cyber-button">
                    <SelectValue placeholder="Select target element" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {elements
                      .filter(el => el.id !== elementId)
                      .map(element => (
                        <SelectItem key={element.id} value={element.id}>
                          {element.name} ({element.element_type})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="constraint-data">Constraint Data (JSON)</Label>
                <Input
                  id="constraint-data"
                  placeholder='{"rule": "value", "tolerance": 0.1}'
                  value={JSON.stringify(formData.constraint_data)}
                  onChange={(e) => {
                    try {
                      const data = JSON.parse(e.target.value || '{}');
                      setFormData(prev => ({ ...prev, constraint_data: data }));
                    } catch {
                      // Invalid JSON, keep current state
                    }
                  }}
                  className="cyber-button"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is-active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is-active">Active</Label>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="cyber-button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="cyber-button bg-primary text-primary-foreground"
                >
                  Create Constraint
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {constraints.length === 0 ? (
        <Card className="gradient-border">
          <CardContent className="p-8 text-center">
            <Link className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Constraints</h3>
            <p className="text-muted-foreground mb-4">
              This element has no constraints defined yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {constraints.map((constraint) => (
            <Card key={constraint.id} className="gradient-border glow-cyan">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className={getConstraintTypeColor(constraint.constraint_type)}>
                      {constraint.constraint_type}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      {constraint.is_active ? (
                        <ToggleRight className="w-5 h-5 text-green-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                      )}
                      <span className={constraint.is_active ? 'text-green-400' : 'text-gray-400'}>
                        {constraint.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleConstraint(constraint.id)}
                      disabled={updating}
                      className="cyber-button"
                    >
                      {constraint.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(constraint.id)}
                      disabled={deleting}
                      className="cyber-button hover:bg-destructive/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Target Element:</span>
                    <p className="font-medium">
                      {(constraint as any).target_element?.name || 'None'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p className="font-medium">
                      {new Date(constraint.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-muted-foreground">Constraint Data:</span>
                    <pre className="mt-1 p-2 bg-secondary/50 rounded text-xs overflow-x-auto">
                      {JSON.stringify(constraint.constraint_data, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
