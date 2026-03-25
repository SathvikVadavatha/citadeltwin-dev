
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import { useCostDatabase } from '@/hooks/useCostDatabase';
import type { CostLineItem } from '@/types/cost-estimation';

interface AddLineItemModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<CostLineItem>) => Promise<CostLineItem | null>;
  estimationId: string;
}

export const AddLineItemModal = ({ open, onClose, onSubmit, estimationId }: AddLineItemModalProps) => {
  const [activeTab, setActiveTab] = useState('manual');
  const [formData, setFormData] = useState({
    item_description: '',
    category: 'material' as const,
    quantity: 1,
    unit_of_measure: 'm3',
    unit_cost: 0,
    labor_hours_per_unit: 0,
    waste_factor: 5,
    notes: '',
    cost_database_source: 'custom' as const,
  });
  const [loading, setLoading] = useState(false);
  
  const { costItems, searchCostItems } = useCostDatabase();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const adjustedQuantity = formData.quantity * (1 + formData.waste_factor / 100);
      const totalCost = adjustedQuantity * formData.unit_cost;
      const totalLaborHours = adjustedQuantity * formData.labor_hours_per_unit;

      const result = await onSubmit({
        ...formData,
        total_cost: totalCost,
        total_labor_hours: totalLaborHours,
      });
      
      if (result) {
        onClose();
        setFormData({
          item_description: '',
          category: 'material',
          quantity: 1,
          unit_of_measure: 'm3',
          unit_cost: 0,
          labor_hours_per_unit: 0,
          waste_factor: 5,
          notes: '',
          cost_database_source: 'custom',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDatabaseItemSelect = (item: any) => {
    setFormData(prev => ({
      ...prev,
      item_description: item.item_description,
      item_code: item.item_code,
      category: item.category,
      unit_of_measure: item.unit_of_measure,
      unit_cost: item.base_cost,
      labor_hours_per_unit: item.labor_hours_per_unit || 0,
      cost_database_source: item.provider,
    }));
    setActiveTab('manual');
  };

  const handleSearch = () => {
    searchCostItems(searchQuery);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="gradient-border max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="shadow-sm">Add Line Item</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card border border-border">
            <TabsTrigger value="manual" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="database" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Cost Database
            </TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cost database..."
                className="skeuo-button"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} className="skeuo-button">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {costItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No items found. Try searching for materials, labor, or equipment.
                </p>
              ) : (
                costItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-border rounded p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => handleDatabaseItemSelect(item)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{item.item_description}</p>
                        <p className="text-sm text-muted-foreground">{item.item_code} - {item.provider}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${item.base_cost.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">per {item.unit_of_measure}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="description">Item Description</Label>
                  <Input
                    id="description"
                    value={formData.item_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, item_description: e.target.value }))}
                    placeholder="e.g., Concrete, Ready-Mix, 3000 PSI"
                    className="skeuo-button"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}
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
                  <Label htmlFor="unit">Unit of Measure</Label>
                  <Select
                    value={formData.unit_of_measure}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, unit_of_measure: value }))}
                  >
                    <SelectTrigger className="skeuo-button">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cy">Cubic Yards</SelectItem>
                      <SelectItem value="sf">Square Feet</SelectItem>
                      <SelectItem value="lf">Linear Feet</SelectItem>
                      <SelectItem value="ea">Each</SelectItem>
                      <SelectItem value="hr">Hours</SelectItem>
                      <SelectItem value="ton">Tons</SelectItem>
                      <SelectItem value="m3">Cubic Meters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    className="skeuo-button"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="unitCost">Unit Cost ($)</Label>
                  <Input
                    id="unitCost"
                    type="number"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit_cost: parseFloat(e.target.value) || 0 }))}
                    className="skeuo-button"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="laborHours">Labor Hours per Unit</Label>
                  <Input
                    id="laborHours"
                    type="number"
                    step="0.01"
                    value={formData.labor_hours_per_unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, labor_hours_per_unit: parseFloat(e.target.value) || 0 }))}
                    className="skeuo-button"
                  />
                </div>

                <div>
                  <Label htmlFor="wasteFactor">Waste Factor (%)</Label>
                  <Input
                    id="wasteFactor"
                    type="number"
                    step="0.1"
                    value={formData.waste_factor}
                    onChange={(e) => setFormData(prev => ({ ...prev, waste_factor: parseFloat(e.target.value) || 0 }))}
                    className="skeuo-button"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes or specifications..."
                  className="skeuo-button"
                  rows={3}
                />
              </div>

              {/* Cost Preview */}
              <div className="bg-accent/20 p-4 rounded border">
                <h4 className="font-medium mb-2">Cost Preview</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Base Quantity:</span>
                    <p>{formData.quantity} {formData.unit_of_measure}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">With Waste ({formData.waste_factor}%):</span>
                    <p>{(formData.quantity * (1 + formData.waste_factor / 100)).toFixed(2)} {formData.unit_of_measure}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Cost:</span>
                    <p className="font-medium">${(formData.quantity * (1 + formData.waste_factor / 100) * formData.unit_cost).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Labor Hours:</span>
                    <p>{(formData.quantity * (1 + formData.waste_factor / 100) * formData.labor_hours_per_unit).toFixed(1)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="skeuo-button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.item_description}
                  className="skeuo-button bg-primary text-primary-foreground"
                >
                  {loading ? 'Adding...' : 'Add Line Item'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
