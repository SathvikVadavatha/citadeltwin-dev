
import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

// Raw database types (what comes from Supabase)
interface DatabaseSnapshot {
  id: string;
  project_id: string;
  user_id: string;
  snapshot_name: string;
  description?: string;
  parent_snapshot_id?: string;
  branch_name: string;
  is_current: boolean;
  created_at: string;
  snapshot_data: any; // Json from database
  metadata: any; // Json from database
}

interface DatabaseBranch {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  created_by: string;
  current_snapshot_id?: string;
  created_at: string;
}

// Application types (what we use in the app)
export interface SnapshotData {
  elements: any[];
  project_data: any;
  metadata: {
    snapshot_version: string;
    created_by: string;
    element_types: string[];
  };
}

export interface SnapshotMetadata {
  elements_count: number;
  file_size: number;
  timestamp: string;
  changes_summary: string[];
}

export interface ProjectSnapshot {
  id: string;
  project_id: string;
  user_id: string;
  snapshot_name: string;
  description?: string;
  parent_snapshot_id?: string;
  branch_name: string;
  is_current: boolean;
  created_at: string;
  snapshot_data: SnapshotData;
  metadata: SnapshotMetadata;
}

export interface Branch {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  created_by: string;
  current_snapshot_id?: string;
  created_at: string;
}

export interface VersionDiff {
  element_id: string;
  change_type: 'added' | 'modified' | 'deleted';
  before: any;
  after: any;
  properties_changed: string[];
}

// Helper function to convert database snapshot to app snapshot
const convertDatabaseSnapshot = (dbSnapshot: DatabaseSnapshot): ProjectSnapshot => {
  return {
    ...dbSnapshot,
    snapshot_data: dbSnapshot.snapshot_data as SnapshotData,
    metadata: dbSnapshot.metadata as SnapshotMetadata,
  };
};

export const useVersionControl = (projectId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentBranch, setCurrentBranch] = useState('main');

  // Fetch snapshots
  const { data: snapshots = [], isLoading: snapshotsLoading } = useQuery({
    queryKey: ['project-snapshots', projectId, currentBranch],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_snapshots')
        .select('*')
        .eq('project_id', projectId)
        .eq('branch_name', currentBranch)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(convertDatabaseSnapshot);
    },
    enabled: !!projectId && !!user,
  });

  // Fetch branches
  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ['project-branches', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_branches')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Branch[];
    },
    enabled: !!projectId && !!user,
  });

  // Create snapshot mutation
  const createSnapshotMutation = useMutation({
    mutationFn: async (params: { name: string; description?: string; projectData: any }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get current elements
      const { data: elements, error: elementsError } = await supabase
        .from('bim_elements')
        .select('*')
        .eq('project_id', projectId);

      if (elementsError) throw elementsError;

      const snapshotData = {
        elements: elements || [],
        project_data: params.projectData,
        metadata: {
          snapshot_version: '1.0',
          created_by: user.id,
          element_types: [...new Set(elements?.map(e => e.element_type) || [])],
        }
      };

      const snapshotMetadata = {
        elements_count: elements?.length || 0,
        file_size: JSON.stringify(snapshotData).length,
        timestamp: new Date().toISOString(),
        changes_summary: ['Snapshot created']
      };

      const { data, error } = await supabase
        .from('project_snapshots')
        .insert({
          project_id: projectId,
          user_id: user.id,
          snapshot_name: params.name,
          description: params.description,
          snapshot_data: snapshotData,
          metadata: snapshotMetadata,
          branch_name: currentBranch,
          is_current: true
        })
        .select()
        .single();

      if (error) throw error;

      // Update previous snapshots
      await supabase
        .from('project_snapshots')
        .update({ is_current: false })
        .eq('project_id', projectId)
        .eq('branch_name', currentBranch)
        .neq('id', data.id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-snapshots'] });
      toast.success('Snapshot created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create snapshot: ${error.message}`);
    },
  });

  // Restore snapshot mutation
  const restoreSnapshotMutation = useMutation({
    mutationFn: async (snapshotId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get snapshot data
      const { data: snapshot, error: snapshotError } = await supabase
        .from('project_snapshots')
        .select('*')
        .eq('id', snapshotId)
        .single();

      if (snapshotError) throw snapshotError;

      // Clear current elements
      await supabase
        .from('bim_elements')
        .delete()
        .eq('project_id', projectId);

      // Restore elements from snapshot
      const snapshotData = snapshot.snapshot_data as any;
      const elements = snapshotData?.elements || [];
      
      if (elements && elements.length > 0) {
        const { error: insertError } = await supabase
          .from('bim_elements')
          .insert(elements.map((el: any) => ({
            ...el,
            id: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })));

        if (insertError) throw insertError;
      }

      // Update current snapshot
      await supabase
        .from('project_snapshots')
        .update({ is_current: false })
        .eq('project_id', projectId)
        .eq('branch_name', currentBranch);

      await supabase
        .from('project_snapshots')
        .update({ is_current: true })
        .eq('id', snapshotId);

      return snapshot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['bim-elements'] });
      toast.success('Snapshot restored successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to restore snapshot: ${error.message}`);
    },
  });

  // Create branch mutation
  const createBranchMutation = useMutation({
    mutationFn: async (params: { name: string; description?: string; fromSnapshotId?: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('project_branches')
        .insert({
          project_id: projectId,
          name: params.name,
          description: params.description,
          created_by: user.id,
          current_snapshot_id: params.fromSnapshotId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-branches'] });
      toast.success('Branch created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create branch: ${error.message}`);
    },
  });

  // Compare snapshots function
  const compareSnapshots = async (snapshot1Id: string, snapshot2Id: string): Promise<VersionDiff[]> => {
    const { data: snapshots, error } = await supabase
      .from('project_snapshots')
      .select('*')
      .in('id', [snapshot1Id, snapshot2Id]);

    if (error) throw error;

    const [snap1, snap2] = snapshots;
    const snap1Data = snap1.snapshot_data as any;
    const snap2Data = snap2.snapshot_data as any;
    const elements1 = snap1Data?.elements || [];
    const elements2 = snap2Data?.elements || [];

    const diffs: VersionDiff[] = [];
    const elements1Map = new Map(elements1.map((el: any) => [el.id, el]));
    const elements2Map = new Map(elements2.map((el: any) => [el.id, el]));

    // Find added and modified elements
    elements2.forEach((el2: any) => {
      const el1 = elements1Map.get(el2.id);
      if (!el1) {
        diffs.push({
          element_id: el2.id,
          change_type: 'added',
          before: null,
          after: el2,
          properties_changed: Object.keys(el2)
        });
      } else if (JSON.stringify(el1) !== JSON.stringify(el2)) {
        const changedProps = Object.keys(el2).filter(key => 
          JSON.stringify(el1[key]) !== JSON.stringify(el2[key])
        );
        diffs.push({
          element_id: el2.id,
          change_type: 'modified',
          before: el1,
          after: el2,
          properties_changed: changedProps
        });
      }
    });

    // Find deleted elements
    elements1.forEach((el1: any) => {
      if (!elements2Map.has(el1.id)) {
        diffs.push({
          element_id: el1.id,
          change_type: 'deleted',
          before: el1,
          after: null,
          properties_changed: []
        });
      }
    });

    return diffs;
  };

  return {
    snapshots,
    branches,
    currentBranch,
    snapshotsLoading,
    branchesLoading,
    setCurrentBranch,
    createSnapshot: createSnapshotMutation.mutateAsync,
    restoreSnapshot: restoreSnapshotMutation.mutateAsync,
    createBranch: createBranchMutation.mutateAsync,
    compareSnapshots,
    isCreatingSnapshot: createSnapshotMutation.isPending,
    isRestoringSnapshot: restoreSnapshotMutation.isPending,
    isCreatingBranch: createBranchMutation.isPending,
  };
};
