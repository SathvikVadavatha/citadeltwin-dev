
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VersionControlPanel } from './VersionControlPanel';
import { BranchManagementPanel } from './BranchManagementPanel';
import { AuditTrailPanel } from './AuditTrailPanel';
import { ChangeManagementDashboard } from './ChangeManagementDashboard';
import { VersionDiffViewer } from './VersionDiffViewer';
import { useVersionControl } from '@/hooks/useVersionControl';
import { GitBranch, History, Activity, BarChart3 } from 'lucide-react';

interface EnhancedVersionControlPanelProps {
  projectId: string;
}

export const EnhancedVersionControlPanel = ({ projectId }: EnhancedVersionControlPanelProps) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showDiffViewer, setShowDiffViewer] = useState(false);
  const [selectedSnapshots, setSelectedSnapshots] = useState<any[]>([]);

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

  // Mock data for dashboard - in real implementation, calculate from actual data
  const dashboardStats = {
    totalSnapshots: snapshots.length,
    totalBranches: branches.length,
    activeCollaborators: 3, // Would come from collaboration data
    pendingChanges: 2,
    recentActivity: 12,
    branchHealth: {
      healthy: branches.filter(b => b.name !== 'main').length,
      stale: 0,
      conflicts: 0
    }
  };

  const recentChanges = snapshots.slice(0, 5).map(snapshot => ({
    id: snapshot.id,
    type: 'snapshot' as const,
    title: `Snapshot: ${snapshot.snapshot_name}`,
    user: snapshot.metadata?.created_by || 'Unknown',
    timestamp: snapshot.created_at,
    status: 'success' as const,
    branch: snapshot.branch_name
  }));

  // Mock audit events - in real implementation, these would come from database
  const auditEvents = [
    ...snapshots.map(snapshot => ({
      id: snapshot.id,
      type: 'snapshot' as const,
      action: `Created snapshot: ${snapshot.snapshot_name}`,
      user_id: snapshot.user_id,
      user_name: snapshot.metadata?.created_by || 'Unknown User',
      timestamp: snapshot.created_at,
      details: { snapshot_name: snapshot.snapshot_name, description: snapshot.description },
      affected_items: [snapshot.snapshot_name],
      metadata: snapshot.metadata
    })),
    ...branches.map(branch => ({
      id: branch.id,
      type: 'branch' as const,
      action: `Created branch: ${branch.name}`,
      user_id: branch.created_by,
      user_name: 'Unknown User', // Would be resolved from user lookup
      timestamp: branch.created_at,
      details: { branch_name: branch.name, description: branch.description },
      affected_items: [branch.name],
      metadata: {}
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleCompareDiff = (snapshot1: any, snapshot2: any, diffData: any[]) => {
    setSelectedSnapshots([snapshot1, snapshot2]);
    setShowDiffViewer(true);
  };

  const handleBranchMerge = async (sourceBranch: string, targetBranch: string) => {
    // Implementation would handle branch merging logic
    console.log(`Merging ${sourceBranch} into ${targetBranch}`);
  };

  const handleBranchDelete = async (branchId: string) => {
    // Implementation would handle branch deletion
    console.log(`Deleting branch ${branchId}`);
  };

  const handleExportAudit = () => {
    // Implementation would export audit trail
    console.log('Exporting audit trail');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Enhanced Version Control</h2>
        <p className="text-muted-foreground">
          Complete project version management, branching, and audit trail
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="snapshots" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Snapshots
          </TabsTrigger>
          <TabsTrigger value="branches" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Branches
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Audit Trail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ChangeManagementDashboard
            stats={dashboardStats}
            recentChanges={recentChanges}
            onNavigateToSnapshots={() => setActiveTab('snapshots')}
            onNavigateToBranches={() => setActiveTab('branches')}
            onNavigateToAudit={() => setActiveTab('audit')}
          />
        </TabsContent>

        <TabsContent value="snapshots">
          <VersionControlPanel projectId={projectId} />
        </TabsContent>

        <TabsContent value="branches">
          <BranchManagementPanel
            branches={branches.map(branch => ({
              ...branch,
              snapshot_count: snapshots.filter(s => s.branch_name === branch.name).length,
              last_activity: snapshots
                .filter(s => s.branch_name === branch.name)
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                ?.created_at || branch.created_at
            }))}
            currentBranch={currentBranch}
            onSwitchBranch={setCurrentBranch}
            onCreateBranch={createBranch}
            onDeleteBranch={handleBranchDelete}
            onMergeBranch={handleBranchMerge}
            isLoading={isCreatingBranch}
          />
        </TabsContent>

        <TabsContent value="audit">
          <AuditTrailPanel
            events={auditEvents}
            onExportAudit={handleExportAudit}
          />
        </TabsContent>
      </Tabs>

      {showDiffViewer && selectedSnapshots.length === 2 && (
        <VersionDiffViewer
          isOpen={showDiffViewer}
          onClose={() => setShowDiffViewer(false)}
          snapshot1={selectedSnapshots[0]}
          snapshot2={selectedSnapshots[1]}
          diffData={[]} // Would contain actual diff data
        />
      )}
    </div>
  );
};
