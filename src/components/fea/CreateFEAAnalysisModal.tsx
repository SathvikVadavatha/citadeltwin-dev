
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CreateAnalysisData } from "@/hooks/useFEAAnalyses";

interface CreateFEAAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAnalysis: (data: CreateAnalysisData) => Promise<any>;
  elementId?: string;
}

export const CreateFEAAnalysisModal = ({ 
  isOpen, 
  onClose, 
  onCreateAnalysis, 
  elementId 
}: CreateFEAAnalysisModalProps) => {
  const [formData, setFormData] = useState<CreateAnalysisData>({
    element_id: elementId,
    name: "",
    description: "",
    analysis_type: "static",
    input_parameters: {
      mesh: {
        element_size: 0.1,
        element_type: "tetrahedron"
      },
      solver: {
        tolerance: 1e-6,
        max_iterations: 1000
      }
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateAnalysis(formData);
      handleClose();
    } catch (error) {
      console.error('Error creating analysis:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      element_id: elementId,
      name: "",
      description: "",
      analysis_type: "static",
      input_parameters: {
        mesh: {
          element_size: 0.1,
          element_type: "tetrahedron"
        },
        solver: {
          tolerance: 1e-6,
          max_iterations: 1000
        }
      }
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-primary">Create New FEA Analysis</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Set up a new finite element analysis for structural calculations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">Analysis Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter analysis name"
              className="bg-muted border-border text-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              className="bg-muted border-border text-foreground"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="analysis_type" className="text-foreground">Analysis Type</Label>
            <Select 
              value={formData.analysis_type} 
              onValueChange={(value: any) => setFormData({ ...formData, analysis_type: value })}
            >
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue placeholder="Select analysis type" />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                <SelectItem value="static">Static Analysis</SelectItem>
                <SelectItem value="modal">Modal Analysis</SelectItem>
                <SelectItem value="buckling">Buckling Analysis</SelectItem>
                <SelectItem value="thermal">Thermal Analysis</SelectItem>
                <SelectItem value="dynamic">Dynamic Analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="element_size" className="text-foreground">Mesh Size</Label>
              <Input
                id="element_size"
                type="number"
                step="0.01"
                value={formData.input_parameters?.mesh?.element_size || 0.1}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  input_parameters: {
                    ...formData.input_parameters,
                    mesh: {
                      ...formData.input_parameters?.mesh,
                      element_size: parseFloat(e.target.value)
                    }
                  }
                })}
                className="bg-muted border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tolerance" className="text-foreground">Solver Tolerance</Label>
              <Input
                id="tolerance"
                type="number"
                step="1e-8"
                value={formData.input_parameters?.solver?.tolerance || 1e-6}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  input_parameters: {
                    ...formData.input_parameters,
                    solver: {
                      ...formData.input_parameters?.solver,
                      tolerance: parseFloat(e.target.value)
                    }
                  }
                })}
                className="bg-muted border-border text-foreground"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              className="border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.name.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? "Creating..." : "Create Analysis"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
