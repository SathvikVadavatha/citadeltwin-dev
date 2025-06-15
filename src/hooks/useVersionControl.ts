
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { 
  SimpleSnapshot, 
  SimpleBranch, 
  CreateSnapshotParams, 
  CreateBranchParams, 
  VersionDiff 
} from '@/types/version-control';

export const useVersionControl = (projectId: string) => {
  const [snapshots, setSnapshots] = useState<SimpleSnapshot[]>([]);
  const [branches, setBranches] = useState<SimpleBranch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>('main');
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [isRestoringSnapshot, setIsRestoringSnapshot] = useState(false);
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const { user } = useAuth();

  const fetchSnapshots = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('project_snapshots')
        .select('*')
        .eq('project_id', projectId)
        .eq('branch_name', currentBranch)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching snapshots:', error);
        return;
      }

      setSnapshots(data || []);
    } catch (error) {
      console.error('Error fetching snapshots:', error);
    }
  };

  const fetchBranches = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('project_branches')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching branches:', error);
        return;
      }

      setBranches(data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const createSnapshot = async (params: CreateSnapshotParams) => {
    if (!user) return;

    try {
      setIsCreatingSnapshot(true);
      
      const snapshotData = {
        project_id: projectId,
        user_id: user.id,
        snapshot_name: params.name,
        description: params.description,
        branch_name: currentBranch,
        is_current: true,
        snapshot_data: params.projectData,
        metadata: {
          elements_count: 0,
          file_size: JSON.stringify(params.projectData).length,
          created_by: user.email
        }
      };

      const { data, error } = await supabase
        .from('project_snapshots')
        .insert(snapshotData)
        .select()
        .single();

      if (error) {
        console.error('Error creating snapshot:', error);
        toast.error('Failed to create snapshot');
        return;
      }

      // Mark other snapshots as not current
      await supabase
        .from('project_snapshots')
        .update({ is_current: false })
        .eq('project_id', projectId)
        .eq('branch_name', currentBranch)
        .neq('id', data.id);

      toast.success('Snapshot created successfully');
      await fetchSnapshots();
    } catch (error) {
      console.error('Error creating snapshot:', error);
      toast.error('Failed to create snapshot');
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  const restoreSnapshot = async (snapshotId: string) => {
    if (!user) return;

    try {
      setIsRestoringSnapshot(true);
      
      // Mark all snapshots as not current
      await supabase
        .from('project_snapshots')
        .update({ is_current: false })
        .eq('project_id', projectId)
        .eq('branch_name', currentBranch);

      // Mark the selected snapshot as current
      const { error } = await supabase
        .from('project_snapshots')
        .update({ is_current: true })
        .eq('id', snapshotId);

      if (error) {
        console.error('Error restoring snapshot:', error);
        toast.error('Failed to restore snapshot');
        return;
      }

      toast.success('Snapshot restored successfully');
      await fetchSnapshots();
    } catch (error) {
      console.error('Error restoring snapshot:', error);
      toast.error('Failed to restore snapshot');
    } finally {
      setIsRestoringSnapshot(false);
    }
  };

  const createBranch = async (params: CreateBranchParams) => {
    if (!user) return;

    try {
      setIsCreatingBranch(true);
      
      const branchData = {
        project_id: projectId,
        name: params.name,
        description: params.description,
        created_by: user.id,
        current_snapshot_id: params.fromSnapshotId
      };

      const { error } = await supabase
        .from('project_branches')
        .insert(branchData);

      if (error) {
        console.error('Error creating branch:', error);
        toast.error('Failed to create branch');
        return;
      }

      toast.success('Branch created successfully');
      await fetchBranches();
    } catch (error) {
      console.error('Error creating branch:', error);
      toast.error('Failed to create branch');
    } finally {
      setIsCreatingBranch(false);
    }
  };

  const compareSnapshots = async (snapshot1Id: string, snapshot2Id: string): Promise<VersionDiff[]> => {
    try {
      const { data: snapshots, error } = await supabase
        .from('project_snapshots')
        .select('*')
        .in('id', [snapshot1Id, snapshot2Id]);

      if (error || !snapshots || snapshots.length !== 2) {
        console.error('Error fetching snapshots for comparison:', error);
        return [];
      }

      // Simple diff logic - in a real implementation, this would be more sophisticated
      const diffs: VersionDiff[] = [];
      
      // Mock comparison result for now
      diffs.push({
        element_id: 'mock-element-1',
        change_type: 'modified',
        before: { property: 'old_value' },
        after: { property: 'new_value' },
        properties_changed: ['property']
      });

      return diffs;
    } catch (error) {
      console.error('Error comparing snapshots:', error);
      return [];
    }
  };

  useEffect(() => {
    if (user && projectId) {
      fetchSnapshots();
      fetchBranches();
    }
  }, [user, projectId, currentBranch]);

  return {
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
  };
};
