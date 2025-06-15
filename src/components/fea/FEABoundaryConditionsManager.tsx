import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Anchor } from "lucide-react";
import { useFEAAnalyses, type CreateBoundaryConditionData } from "@/hooks/useFEAAnalyses";
import type { Database } from '@/integrations/supabase/types';

type FEABoundaryCondition = Database['public']['Tables']['fea_boundary_conditions']['Row'];

interface FEABoundaryConditionsManagerProps {
  analysisId: string;
  boundaryConditions: FEABoundaryCondition[];
  onRefresh: () => void;
}

export const FEABoundaryConditionsManager = ({ 
  analysisId, 
  boundaryConditions, 
  onRefresh 
}: FEABoundaryConditionsManagerProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newBC, setNewBC] = useState<Partial<CreateBoundaryConditionData>>({
    analysis_id: analysisId,
    condition_type: 'fixed',
    name: '',
    location: { x: 0, y: 0, z: 0 },
    constraints: { x: true, y: true, z: true, rx: false, ry: false, rz: false },
  });

  const { createBoundaryCondition } = useFEAAnalyses();

  const handleCreateBC = async () => {
    if (!newBC.name) return;

    await createBoundaryCondition(newBC as CreateBoundaryConditionData);
    setNewBC({
      analysis_id: analysisId,
      condition_type: 'fixed',
      name: '',
      location: { x: 0, y: 0, z: 0 },
      constraints: { x: true, y: true, z: true, rx: false, ry: false, rz: false },
    });
    setIsCreating(false);
    onRefresh();
  };

  const getBCTypeIcon = (type: string) => {
    switch (type) {
      case 'fixed':
        return '🔒';
      case 'pinned':
        return '📌';
      case 'roller':
        return '🔄';
      case 'free':
        return '🆓';
      case 'symmetry':
        return '↔️';
      default:
        return '⚓';
    }
  };

  const getConstraintString = (constraints: any) => {
    const activeConstraints = [];
    if (constraints.x) activeConstraints.push('X');
    if (constraints.y) activeConstraints.push('Y');
    if (constraints.z) activeConstraints.push('Z');
    if (constraints.rx) activeConstraints.push('RX');
    if (constraints.ry) activeConstraints.push('RY');
    if (constraints.rz) activeConstraints.push('RZ');
    return activeConstraints.length > 0 ? activeConstraints.join(', ') : 'None';
  };

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-cyan-300 flex items-center gap-2">
              <Anchor className="w-5 h-5" />
              Boundary Conditions
            </CardTitle>
            <CardDescription className="text-gray-400">
              Define support conditions and constraints
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setIsCreating(!isCreating)}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Constraint
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Create New Boundary Condition Form */}
        {isCreating && (
          <div className="bg-gray-800 p-4 rounded-lg space-y-4">
            <h4 className="font-medium text-gray-200">Create New Boundary Condition</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-200">Constraint Name</Label>
                <Input
                  value={newBC.name}
                  onChange={(e) => setNewBC({ ...newBC, name: e.target.value })}
                  placeholder="Enter constraint name"
                  className="bg-gray-700 border-gray-600 text-gray-100"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-200">Condition Type</Label>
                <Select 
                  value={newBC.condition_type} 
                  onValueChange={(value: any) => setNewBC({ ...newBC, condition_type: value })}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="pinned">Pinned</SelectItem>
                    <SelectItem value="roller">Roller</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="symmetry">Symmetry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-200">Position X (m)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newBC.location?.x}
                  onChange={(e) => setNewBC({ 
                    ...newBC, 
                    location: { ...newBC.location!, x: parseFloat(e.target.value) || 0 }
                  })}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-200">Position Y (m)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newBC.location?.y}
                  onChange={(e) => setNewBC({ 
                    ...newBC, 
                    location: { ...newBC.location!, y: parseFloat(e.target.value) || 0 }
                  })}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-200">Position Z (m)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newBC.location?.z}
                  onChange={(e) => setNewBC({ 
                    ...newBC, 
                    location: { ...newBC.location!, z: parseFloat(e.target.value) || 0 }
                  })}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-gray-200">Constrained Degrees of Freedom</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Translation</Label>
                  <div className="space-y-2">
                    {['x', 'y', 'z'].map((axis) => (
                      <div key={axis} className="flex items-center space-x-2">
                        <Checkbox
                          id={`trans-${axis}`}
                          checked={newBC.constraints?.[axis as keyof typeof newBC.constraints]}
                          onCheckedChange={(checked) => setNewBC({
                            ...newBC,
                            constraints: { ...newBC.constraints!, [axis]: checked }
                          })}
                        />
                        <Label htmlFor={`trans-${axis}`} className="text-sm text-gray-300">
                          {axis.toUpperCase()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Rotation</Label>
                  <div className="space-y-2">
                    {['rx', 'ry', 'rz'].map((axis) => (
                      <div key={axis} className="flex items-center space-x-2">
                        <Checkbox
                          id={`rot-${axis}`}
                          checked={newBC.constraints?.[axis as keyof typeof newBC.constraints]}
                          onCheckedChange={(checked) => setNewBC({
                            ...newBC,
                            constraints: { ...newBC.constraints!, [axis]: checked }
                          })}
                        />
                        <Label htmlFor={`rot-${axis}`} className="text-sm text-gray-300">
                          {axis.toUpperCase()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCreateBC}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={!newBC.name}
              >
                Create Constraint
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsCreating(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Existing Boundary Conditions */}
        {boundaryConditions.length === 0 ? (
          <div className="text-center text-gray-400 py-4">
            No boundary conditions defined. Add constraints to define support conditions.
          </div>
        ) : (
          <div className="space-y-3">
            {boundaryConditions.map((bc) => (
              <div key={bc.id} className="bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getBCTypeIcon(bc.condition_type)}</span>
                    <span className="font-medium text-gray-200">{bc.name}</span>
                    <Badge variant="outline" className="capitalize">
                      {bc.condition_type}
                    </Badge>
                  </div>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                  <div>
                    <span className="font-medium">Position:</span> ({bc.location.x}, {bc.location.y}, {bc.location.z})
                  </div>
                  <div>
                    <span className="font-medium">Constraints:</span> {getConstraintString(bc.constraints)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
