
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CostEstimation } from '@/types/cost-estimation';

interface CreateEstimationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<CostEstimation>) => Promise<CostEstimation | null>;
  projectId: string;
}

export const CreateEstimationModal = ({ open, onClose, onSubmit, projectId }: CreateEstimationModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    markup_percentage: 15,
    contingency_percentage: 10,
    labor_rate_per_hour: 45,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await onSubmit(formData);
      if (result) {
        onClose();
        setFormData({
          name: '',
          description: '',
          markup_percentage: 15,
          contingency_percentage: 10,
          labor_rate_per_hour: 45,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="gradient-border max-w-md">
        <DialogHeader>
          <DialogTitle className="glow-cyan">Create Cost Estimation</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Estimation Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Initial Cost Estimate"
              className="cyber-button"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this estimation..."
              className="cyber-button"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="markup">Markup (%)</Label>
              <Input
                id="markup"
                type="number"
                step="0.1"
                value={formData.markup_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, markup_percentage: parseFloat(e.target.value) || 0 }))}
                className="cyber-button"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contingency">Contingency (%)</Label>
              <Input
                id="contingency"
                type="number"
                step="0.1"
                value={formData.contingency_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, contingency_percentage: parseFloat(e.target.value) || 0 }))}
                className="cyber-button"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="laborRate">Labor Rate ($/hour)</Label>
            <Input
              id="laborRate"
              type="number"
              step="0.01"
              value={formData.labor_rate_per_hour}
              onChange={(e) => setFormData(prev => ({ ...prev, labor_rate_per_hour: parseFloat(e.target.value) || 0 }))}
              className="cyber-button"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="cyber-button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name}
              className="cyber-button bg-primary text-primary-foreground"
            >
              {loading ? 'Creating...' : 'Create Estimation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
