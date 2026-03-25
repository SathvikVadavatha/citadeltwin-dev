
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Save, X } from 'lucide-react';
import type { CostLineItem, CostSummary } from '@/types/cost-estimation';

interface LineItemsTableProps {
  lineItems: CostLineItem[];
  onUpdateLineItem: (id: string, updates: Partial<CostLineItem>) => void;
  onDeleteLineItem: (id: string) => void;
  costSummary: CostSummary;
}

export const LineItemsTable = ({
  lineItems,
  onUpdateLineItem,
  onDeleteLineItem,
  costSummary,
}: LineItemsTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CostLineItem>>({});

  const startEditing = (item: CostLineItem) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const saveEdit = () => {
    if (editingId && editForm) {
      // Recalculate totals
      const quantity = editForm.quantity || 0;
      const unitCost = editForm.unit_cost || 0;
      const laborHours = editForm.labor_hours_per_unit || 0;
      const wasteFactor = editForm.waste_factor || 0;

      const adjustedQuantity = quantity * (1 + wasteFactor / 100);
      const totalCost = adjustedQuantity * unitCost;
      const totalLaborHours = adjustedQuantity * laborHours;

      onUpdateLineItem(editingId, {
        ...editForm,
        total_cost: totalCost,
        total_labor_hours: totalLaborHours,
      });
    }
    setEditingId(null);
    setEditForm({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      material: 'bg-blue-500/20 text-blue-600 border-blue-600/50',
      labor: 'bg-green-500/20 text-green-600 border-green-600/50',
      equipment: 'bg-yellow-500/20 text-yellow-600 border-yellow-600/50',
      overhead: 'bg-purple-500/20 text-purple-600 border-purple-600/50',
      contingency: 'bg-red-500/20 text-destructive border-destructive/50',
    };
    return colors[category as keyof typeof colors] || colors.material;
  };

  return (
    <div className="space-y-6">
      {/* Summary Row */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="text-lg">Cost Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Materials:</span>
              <p className="font-medium">${costSummary.totalMaterialCost.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Labor:</span>
              <p className="font-medium">${costSummary.totalLaborCost.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Equipment:</span>
              <p className="font-medium">${costSummary.totalEquipmentCost.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Total:</span>
              <p className="font-medium text-lg shadow-sm">${costSummary.totalCost.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items Table */}
      <Card className="gradient-border">
        <CardHeader>
          <CardTitle>Line Items ({lineItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lineItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No line items added yet. Click "Add Line Item" to get started.
              </div>
            ) : (
              lineItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  {editingId === item.id ? (
                    // Edit Mode
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div>
                        <Input
                          value={editForm.item_description || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, item_description: e.target.value }))}
                          placeholder="Description"
                          className="skeuo-button"
                        />
                      </div>
                      <div>
                        <Select
                          value={editForm.category || ''}
                          onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value as any }))}
                        >
                          <SelectTrigger className="skeuo-button">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="material">Material</SelectItem>
                            <SelectItem value="labor">Labor</SelectItem>
                            <SelectItem value="equipment">Equipment</SelectItem>
                            <SelectItem value="overhead">Overhead</SelectItem>
                            <SelectItem value="contingency">Contingency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Input
                          type="number"
                          value={editForm.quantity || 0}
                          onChange={(e) => setEditForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                          placeholder="Quantity"
                          className="skeuo-button"
                        />
                      </div>
                      <div>
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.unit_cost || 0}
                          onChange={(e) => setEditForm(prev => ({ ...prev, unit_cost: parseFloat(e.target.value) || 0 }))}
                          placeholder="Unit Cost"
                          className="skeuo-button"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={saveEdit} className="skeuo-button">
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit} className="skeuo-button">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-center justify-between">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1">
                        <div>
                          <p className="font-medium">{item.item_description}</p>
                          <p className="text-xs text-muted-foreground">{item.item_code || 'Custom'}</p>
                        </div>
                        <div>
                          <Badge className={getCategoryColor(item.category)}>
                            {item.category}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm">{item.quantity} {item.unit_of_measure}</p>
                        </div>
                        <div>
                          <p className="text-sm">${item.unit_cost.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="font-medium">${item.total_cost.toLocaleString()}</p>
                          {item.total_labor_hours > 0 && (
                            <p className="text-xs text-muted-foreground">{item.total_labor_hours.toFixed(1)} hrs</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditing(item)}
                          className="skeuo-button"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDeleteLineItem(item.id)}
                          className="skeuo-button text-destructive hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
