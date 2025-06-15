
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CreateSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string; projectData: any }) => Promise<void>;
  isLoading: boolean;
}

export const CreateSnapshotModal = ({ isOpen, onClose, onSubmit, isLoading }: CreateSnapshotModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        projectData: {} // This would contain current project state
      });
      setName('');
      setDescription('');
      onClose();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Project Snapshot</DialogTitle>
          <DialogDescription>
            Save the current state of your project as a snapshot that you can restore later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="snapshot-name">Snapshot Name *</Label>
              <Input
                id="snapshot-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Before structural changes"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="snapshot-description">Description</Label>
              <Textarea
                id="snapshot-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what changes this snapshot captures..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? 'Creating...' : 'Create Snapshot'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
