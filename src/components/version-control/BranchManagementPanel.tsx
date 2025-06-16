
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  GitBranch, 
  GitMerge, 
  Plus, 
  Trash2, 
  Eye, 
  Clock, 
  User,
  ArrowRight,
  GitCommit
} from 'lucide-react';
import { format } from 'date-fns';

interface Branch {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  current_snapshot_id?: string;
  snapshot_count: number;
  last_activity: string;
  is_active?: boolean;
}

interface BranchManagementPanelProps {
  branches: Branch[];
  currentBranch: string;
  onSwitchBranch: (branchName: string) => void;
  onCreateBranch: (data: { name: string; description?: string; fromBranch?: string }) => Promise<void>;
  onDeleteBranch: (branchId: string) => Promise<void>;
  onMergeBranch: (sourceBranch: string, targetBranch: string) => Promise<void>;
  isLoading?: boolean;
}

export const BranchManagementPanel = ({
  branches,
  currentBranch,
  onSwitchBranch,
  onCreateBranch,
  onDeleteBranch,
  onMergeBranch,
  isLoading = false
}: BranchManagementPanelProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [mergeBranch, setMergeBranch] = useState('');
  const [newBranchData, setNewBranchData] = useState({
    name: '',
    description: '',
    fromBranch: currentBranch
  });

  const handleCreateBranch = async () => {
    if (!newBranchData.name.trim()) return;
    
    await onCreateBranch(newBranchData);
    setNewBranchData({ name: '', description: '', fromBranch: currentBranch });
    setShowCreateDialog(false);
  };

  const handleMergeBranch = async () => {
    if (!selectedBranch || !mergeBranch) return;
    
    await onMergeBranch(selectedBranch.name, mergeBranch);
    setShowMergeDialog(false);
    setSelectedBranch(null);
    setMergeBranch('');
  };

  const getBranchStatus = (branch: Branch) => {
    if (branch.name === currentBranch) return 'active';
    if (branch.name === 'main') return 'main';
    return 'feature';
  };

  const getBranchBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'main': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Branch Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage project branches and merge changes
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Branch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Branch</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="branch-name">Branch Name</Label>
                <Input
                  id="branch-name"
                  value={newBranchData.name}
                  onChange={(e) => setNewBranchData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="feature/new-design"
                />
              </div>
              <div>
                <Label htmlFor="branch-description">Description</Label>
                <Textarea
                  id="branch-description"
                  value={newBranchData.description}
                  onChange={(e) => setNewBranchData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the purpose of this branch..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="from-branch">Branch From</Label>
                <select
                  id="from-branch"
                  value={newBranchData.fromBranch}
                  onChange={(e) => setNewBranchData(prev => ({ ...prev, fromBranch: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {branches.map((branch) => (
                    <option key={branch.name} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateBranch} disabled={!newBranchData.name.trim()}>
                  Create Branch
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {branches.map((branch) => {
          const status = getBranchStatus(branch);
          return (
            <Card key={branch.id} className={status === 'active' ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GitBranch className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-base">{branch.name}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {branch.created_by}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(branch.created_at), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitCommit className="h-3 w-3" />
                          {branch.snapshot_count} snapshots
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getBranchBadgeVariant(status)}>
                      {status}
                    </Badge>
                    {branch.name !== currentBranch && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSwitchBranch(branch.name)}
                        disabled={isLoading}
                      >
                        Switch
                      </Button>
                    )}
                    {branch.name !== 'main' && branch.name !== currentBranch && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedBranch(branch);
                            setShowMergeDialog(true);
                          }}
                        >
                          <GitMerge className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteBranch(branch.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              {branch.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{branch.description}</p>
                  <Separator className="my-3" />
                  <div className="text-xs text-muted-foreground">
                    Last activity: {format(new Date(branch.last_activity), 'MMM d, yyyy HH:mm')}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Branch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline">{selectedBranch?.name}</Badge>
              <ArrowRight className="h-4 w-4" />
              <select
                value={mergeBranch}
                onChange={(e) => setMergeBranch(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">Select target branch</option>
                {branches
                  .filter(b => b.name !== selectedBranch?.name)
                  .map((branch) => (
                    <option key={branch.name} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="text-sm text-muted-foreground">
              This will merge changes from <strong>{selectedBranch?.name}</strong> into{' '}
              <strong>{mergeBranch}</strong>. This action cannot be undone.
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMergeDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleMergeBranch} 
                disabled={!mergeBranch}
                variant="destructive"
              >
                Merge Branch
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
