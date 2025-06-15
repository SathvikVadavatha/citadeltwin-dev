
// Simple, explicit types to avoid infinite instantiation
export interface SimpleSnapshot {
  id: string;
  project_id: string;
  user_id: string;
  snapshot_name: string;
  description?: string;
  parent_snapshot_id?: string;
  branch_name: string;
  is_current: boolean;
  created_at: string;
  snapshot_data: any;
  metadata: any;
}

export interface SimpleBranch {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  created_by: string;
  current_snapshot_id?: string;
  created_at: string;
}

export interface CreateSnapshotParams {
  name: string;
  description?: string;
  projectData: any;
}

export interface CreateBranchParams {
  name: string;
  description?: string;
  fromSnapshotId?: string;
}

export interface VersionDiff {
  element_id: string;
  change_type: 'added' | 'modified' | 'deleted';
  before: any;
  after: any;
  properties_changed: string[];
}
