
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { useClientPortalProjectAnalysis } from './useClientPortalProjectAnalysis';

export type {
  ClientPortalProject,
  NewClientPortalProject,
  UpdateClientPortalProject,
  ClientPortalProcessingStatus,
  ClientPortalProjectResults,
  ClientPortalRoomResults,
} from './clientPortalTypes';

import type {
  ClientPortalProject,
  NewClientPortalProject,
  UpdateClientPortalProject,
  ClientPortalProjectResults,
} from './clientPortalTypes';

export const useClientPortalProjects = () => {
  const [projects, setProjects] = useState<ClientPortalProject[]>([]);
  const [projectResults, setProjectResults] = useState<ClientPortalProjectResults[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { runAnalysis } = useClientPortalProjectAnalysis();

  const fetchProjects = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('client_portal_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching client portal projects:', error);
        return;
      }

      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching client portal projects:', error);
    }
  };

  const fetchProjectResults = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('client_portal_project_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching client portal project results:', error);
        return;
      }

      setProjectResults((data || []) as ClientPortalProjectResults[]);
    } catch (error) {
      console.error('Error fetching client portal project results:', error);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchProjects(), fetchProjectResults()]);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (input: NewClientPortalProject, file?: File | null) => {
    if (!user) {
      throw new Error('You must be signed in to add a project.');
    }

    const { data: project, error } = await supabase
      .from('client_portal_projects')
      .insert({
        project_name: input.projectName,
        client_name: input.clientName,
        site_address: input.siteAddress,
        latitude: input.latitude,
        longitude: input.longitude,
        building_type: input.buildingType,
        building_sub_type: input.buildingSubType,
        blueprint_file_name: input.blueprintFileName,
        blueprint_file_size: input.blueprintFileSize,
        blueprint_file_type: input.blueprintFileType,
        status: 'in_progress',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    const { data: resultsRow, error: resultsError } = await supabase
      .from('client_portal_project_results')
      .insert({
        project_id: project.id,
        processing_status: 'running',
        created_by: user.id,
      })
      .select()
      .single();

    if (resultsError) {
      // Don't leave an orphaned project row with no results row behind —
      // a retry submit should create exactly one clean project, not pile up duplicates.
      await supabase.from('client_portal_projects').delete().eq('id', project.id);
      await fetchAll();
      throw resultsError;
    }

    await fetchAll();

    // Fire-and-forget: the modal/UI shouldn't block on GIS + room analysis completing.
    // The row shows "Processing…" until this resolves and refreshes the lists.
    runAnalysis(project as ClientPortalProject, resultsRow.id, file ?? null)
      .catch((err) => console.error('Client portal project analysis failed:', err))
      .finally(() => {
        fetchAll();
      });
  };

  const retryAnalysis = async (project: ClientPortalProject) => {
    if (!user) {
      throw new Error('You must be signed in to retry analysis.');
    }

    const existing = projectResults.find((r) => r.project_id === project.id);
    let resultsId = existing?.id;

    if (resultsId) {
      const { error } = await supabase
        .from('client_portal_project_results')
        .update({ processing_status: 'running', error_message: null })
        .eq('id', resultsId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from('client_portal_project_results')
        .insert({ project_id: project.id, processing_status: 'running', created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      resultsId = data.id;
    }

    await fetchAll();

    runAnalysis(project, resultsId, null)
      .catch((err) => console.error('Client portal project analysis retry failed:', err))
      .finally(() => {
        fetchAll();
      });
  };

  const updateProject = async (id: string, input: UpdateClientPortalProject) => {
    if (!user) {
      throw new Error('You must be signed in to update a project.');
    }

    const payload: Record<string, unknown> = {};
    if (input.projectName !== undefined) payload.project_name = input.projectName;
    if (input.clientName !== undefined) payload.client_name = input.clientName;
    if (input.siteAddress !== undefined) payload.site_address = input.siteAddress;
    if (input.latitude !== undefined) payload.latitude = input.latitude;
    if (input.longitude !== undefined) payload.longitude = input.longitude;
    if (input.buildingType !== undefined) payload.building_type = input.buildingType;
    if (input.buildingSubType !== undefined) payload.building_sub_type = input.buildingSubType;
    if (input.blueprintFileName !== undefined) payload.blueprint_file_name = input.blueprintFileName;
    if (input.blueprintFileSize !== undefined) payload.blueprint_file_size = input.blueprintFileSize;
    if (input.blueprintFileType !== undefined) payload.blueprint_file_type = input.blueprintFileType;
    if (input.blueprintPublicUrl !== undefined) payload.blueprint_public_url = input.blueprintPublicUrl;
    if (input.status !== undefined) payload.status = input.status;
    if (input.feedback !== undefined) payload.feedback = input.feedback;

    const { error } = await supabase
      .from('client_portal_projects')
      .update(payload)
      .eq('id', id);

    if (error) throw error;

    await fetchProjects();
  };

  const deleteProject = async (id: string) => {
    if (!user) {
      throw new Error('You must be signed in to delete a project.');
    }

    const { error } = await supabase.from('client_portal_projects').delete().eq('id', id);

    if (error) throw error;

    await fetchAll();
  };

  useEffect(() => {
    if (user) {
      fetchAll();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Projects can end up with no results row (created before this feature existed, or a
  // partial failure that predates the FIX 1 rollback above). Treat that the same as
  // "needs analysis" and kick it off automatically — no manual "Run analysis" button.
  const autoHealedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || loading) return;

    const resultProjectIds = new Set(projectResults.map((r) => r.project_id));
    const orphans = projects.filter(
      (p) => !resultProjectIds.has(p.id) && !autoHealedRef.current.has(p.id)
    );

    orphans.forEach((project) => {
      autoHealedRef.current.add(project.id);
      retryAnalysis(project).catch((err) => console.error('Auto-run analysis failed:', err));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, projectResults, loading, user]);

  return {
    projects,
    projectResults,
    loading,
    createProject,
    updateProject,
    deleteProject,
    retryAnalysis,
    refreshProjects: fetchAll,
  };
};
