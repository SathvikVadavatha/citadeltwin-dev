
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SimpleSnapshot } from '@/types/version-control';

interface CreateBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string; fromSnapshotId?: string }) => Promise<void>;
  isLoading: boolean;
  snapshots: SimpleSnapshot[];
}

export const CreateBranchModal = ({ isOpen, onClose, onSubmit, isLoading, snapshots }: CreateBranchModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fromSnapshotId, setFromSnapshotId] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        fromSnapshotId: fromSnapshotId || undefined
      });
      setName('');
      setDescription('');
      setFromSnapshotId('');
      onClose();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Branch</DialogTitle>
          <DialogDescription>
            Create a new branch to work on features or experiments without affecting the main line.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="branch-name">Branch Name *</Label>
              <Input
                id="branch-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., feature-new-structure"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-description">Description</Label>
              <Textarea
                id="branch-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose of this branch..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from-snapshot">Branch from Snapshot (optional)</Label>
              <Select value={fromSnapshotId} onValueChange={setFromSnapshotId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a snapshot (or leave empty for current state)" />
                </SelectTrigger>
                <SelectContent>
                  {snapshots.map((snapshot) => (
                    <SelectItem key={snapshot.id} value={snapshot.id}>
                      {snapshot.snapshot_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? 'Creating...' : 'Create Branch'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
