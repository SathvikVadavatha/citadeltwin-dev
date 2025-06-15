
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  GitBranch, 
  GitMerge, 
  History, 
  Camera, 
  RotateCcw, 
  Plus,
  Eye,
  Clock,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { useVersionControl } from '@/hooks/useVersionControl';
import { CreateSnapshotModal } from './CreateSnapshotModal';
import { CreateBranchModal } from './CreateBranchModal';
import { DiffViewer } from './DiffViewer';

interface VersionControlPanelProps {
  projectId: string;
}

export const VersionControlPanel = ({ projectId }: VersionControlPanelProps) => {
  const [showCreateSnapshot, setShowCreateSnapshot] = useState(false);
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [selectedSnapshots, setSelectedSnapshots] = useState<string[]>([]);
  const [showDiff, setShowDiff] = useState(false);

  const {
    snapshots,
    branches,
    currentBranch,
    setCurrentBranch,
    createSnapshot,
    restoreSnapshot,
    createBranch,
    compareSnapshots,
    isCreatingSnapshot,
    isRestoringSnapshot,
    isCreatingBranch,
  } = useVersionControl(projectId);

  const handleSnapshotSelect = (snapshotId: string) => {
    if (selectedSnapshots.includes(snapshotId)) {
      setSelectedSnapshots(prev => prev.filter(id => id !== snapshotId));
    } else if (selectedSnapshots.length < 2) {
      setSelectedSnapshots(prev => [...prev, snapshotId]);
    }
  };

  const canCompare = selectedSnapshots.length === 2;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Version Control</h2>
          <p className="text-muted-foreground">Manage project versions, branches, and changes</p>
        </div>
        <div className="flex items-center gap-2">
          {canCompare && (
            <Button
              variant="outline"
              onClick={() => setShowDiff(true)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Compare
            </Button>
          )}
          <Button
            onClick={() => setShowCreateSnapshot(true)}
            disabled={isCreatingSnapshot}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            Create Snapshot
          </Button>
        </div>
      </div>

      <Tabs defaultValue="snapshots" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="snapshots" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Snapshots
          </TabsTrigger>
          <TabsTrigger value="branches" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Branches
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Audit Trail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="snapshots" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Snapshots</CardTitle>
                  <CardDescription>
                    Manage and restore project snapshots on branch: {currentBranch}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={currentBranch}
                    onChange={(e) => setCurrentBranch(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    {branches.map((branch) => (
                      <option key={branch.name} value={branch.name}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {canCompare && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    {selectedSnapshots.length} snapshots selected for comparison
                  </p>
                </div>
              )}
              
              <div className="space-y-3">
                {snapshots.map((snapshot) => (
                  <div
                    key={snapshot.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedSnapshots.includes(snapshot.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-border hover:bg-secondary/50'
                    }`}
                    onClick={() => handleSnapshotSelect(snapshot.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{snapshot.snapshot_name}</h4>
                          {snapshot.is_current && (
                            <Badge variant="default">Current</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {snapshot.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(snapshot.created_at), 'MMM d, yyyy HH:mm')}
                          </span>
                          <span>{snapshot.metadata.elements_count} elements</span>
                          <span>{(snapshot.metadata.file_size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!snapshot.is_current && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              restoreSnapshot(snapshot.id);
                            }}
                            disabled={isRestoringSnapshot}
                            className="flex items-center gap-1"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Restore
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Branches</CardTitle>
                  <CardDescription>
                    Create and manage different development branches
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowCreateBranch(true)}
                  disabled={isCreatingBranch}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Branch
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {branches.map((branch) => (
                  <div
                    key={branch.name}
                    className={`p-4 border rounded-lg ${
                      branch.name === currentBranch
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <GitBranch className="h-4 w-4" />
                          <h4 className="font-semibold">{branch.name}</h4>
                          {branch.name === currentBranch && (
                            <Badge variant="default">Active</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {branch.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {branch.created_by}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(branch.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {branch.name !== currentBranch && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentBranch(branch.name)}
                          >
                            Switch
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>
                Complete history of all changes and actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {snapshots.map((snapshot) => (
                  <div key={snapshot.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm">
                        Snapshot <strong>{snapshot.snapshot_name}</strong> created
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(snapshot.created_at), 'MMM d, yyyy HH:mm')} • Branch: {snapshot.branch_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateSnapshotModal
        isOpen={showCreateSnapshot}
        onClose={() => setShowCreateSnapshot(false)}
        onSubmit={createSnapshot}
        isLoading={isCreatingSnapshot}
      />

      <CreateBranchModal
        isOpen={showCreateBranch}
        onClose={() => setShowCreateBranch(false)}
        onSubmit={createBranch}
        isLoading={isCreatingBranch}
        snapshots={snapshots}
      />

      {showDiff && selectedSnapshots.length === 2 && (
        <DiffViewer
          isOpen={showDiff}
          onClose={() => setShowDiff(false)}
          snapshot1Id={selectedSnapshots[0]}
          snapshot2Id={selectedSnapshots[1]}
          compareSnapshots={compareSnapshots}
        />
      )}
    </div>
  );
};
