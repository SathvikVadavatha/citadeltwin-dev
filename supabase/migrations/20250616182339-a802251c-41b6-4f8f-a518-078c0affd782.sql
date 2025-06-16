
-- Phase 1: Database Foundation - Performance Indexes, Realtime Setup, and Workflow Triggers (Fixed Realtime)

-- ========================================
-- PERFORMANCE INDEXES FOR OPTIMAL QUERIES
-- ========================================

-- Blueprint uploads - Common query patterns
CREATE INDEX IF NOT EXISTS idx_blueprint_uploads_user_project ON public.blueprint_uploads(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_blueprint_uploads_status ON public.blueprint_uploads(upload_status);
CREATE INDEX IF NOT EXISTS idx_blueprint_uploads_created_at ON public.blueprint_uploads(created_at DESC);

-- Compliance violations - Query by upload and severity
CREATE INDEX IF NOT EXISTS idx_compliance_violations_upload_severity ON public.compliance_violations(upload_id, severity);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_status ON public.compliance_violations(status);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_detected_at ON public.compliance_violations(detected_at DESC);

-- FEA analyses - User and status queries
CREATE INDEX IF NOT EXISTS idx_fea_analyses_user_status ON public.fea_analyses(user_id, status);
CREATE INDEX IF NOT EXISTS idx_fea_analyses_element ON public.fea_analyses(element_id);
CREATE INDEX IF NOT EXISTS idx_fea_analyses_upload ON public.fea_analyses(upload_id);

-- FEA results - Analysis lookup
CREATE INDEX IF NOT EXISTS idx_fea_results_analysis_type ON public.fea_results(analysis_id, result_type);

-- GIS layers - Location-based queries
CREATE INDEX IF NOT EXISTS idx_gis_layers_state_city ON public.gis_layers(state, city);
CREATE INDEX IF NOT EXISTS idx_gis_layers_type_status ON public.gis_layers(layer_type, status);

-- BIM elements - Hierarchy and material queries
CREATE INDEX IF NOT EXISTS idx_bim_elements_upload ON public.bim_elements(upload_id);
CREATE INDEX IF NOT EXISTS idx_bim_elements_parent ON public.bim_elements(parent_element_id);
CREATE INDEX IF NOT EXISTS idx_bim_elements_material ON public.bim_elements(material_id);
CREATE INDEX IF NOT EXISTS idx_bim_elements_type ON public.bim_elements(element_type);

-- Document exports - User and status queries
CREATE INDEX IF NOT EXISTS idx_document_exports_user_status ON public.document_exports(generated_by, status);
CREATE INDEX IF NOT EXISTS idx_document_exports_upload ON public.document_exports(upload_id);

-- Collaboration - Session and user queries
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_project ON public.collaboration_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_changes_session ON public.collaboration_changes(session_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_session ON public.user_presence(session_id);

-- Project management
CREATE INDEX IF NOT EXISTS idx_project_snapshots_project_branch ON public.project_snapshots(project_id, branch_name);
CREATE INDEX IF NOT EXISTS idx_project_shares_email ON public.project_shares(shared_with_email);

-- ========================================
-- REALTIME CAPABILITIES SETUP
-- ========================================

-- Enable replica identity for realtime updates
ALTER TABLE public.compliance_violations REPLICA IDENTITY FULL;
ALTER TABLE public.fea_results REPLICA IDENTITY FULL;
ALTER TABLE public.gis_data_updates REPLICA IDENTITY FULL;
ALTER TABLE public.blueprint_uploads REPLICA IDENTITY FULL;

-- Add tables to realtime publication for live updates (only if not already added)
DO $$
BEGIN
  -- Add compliance_violations if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'compliance_violations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.compliance_violations;
  END IF;

  -- Add fea_results if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'fea_results'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.fea_results;
  END IF;

  -- Add gis_data_updates if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'gis_data_updates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.gis_data_updates;
  END IF;

  -- Add document_exports if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'document_exports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.document_exports;
  END IF;

  -- Add blueprint_uploads if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'blueprint_uploads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.blueprint_uploads;
  END IF;
END $$;

-- ========================================
-- AUTOMATED WORKFLOW TRIGGERS
-- ========================================

-- Function to trigger compliance check after blueprint upload
CREATE OR REPLACE FUNCTION public.trigger_compliance_check()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for completed uploads
  IF NEW.upload_status = 'completed' AND OLD.upload_status != 'completed' THEN
    -- Insert a compliance check record
    INSERT INTO public.compliance_checks (
      upload_id,
      user_id,
      check_type,
      status,
      started_at
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'automatic',
      'running',
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS auto_compliance_check_trigger ON public.blueprint_uploads;
CREATE TRIGGER auto_compliance_check_trigger
  AFTER UPDATE ON public.blueprint_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_compliance_check();

-- Function to update collaboration session activity
CREATE OR REPLACE FUNCTION public.update_collaboration_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Update session last activity when changes are made
  UPDATE public.collaboration_sessions 
  SET updated_at = now() 
  WHERE id = NEW.session_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS collaboration_activity_trigger ON public.collaboration_changes;
CREATE TRIGGER collaboration_activity_trigger
  AFTER INSERT ON public.collaboration_changes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_collaboration_activity();

-- Function to auto-generate BIM elements from detection results
CREATE OR REPLACE FUNCTION public.auto_generate_bim_elements()
RETURNS TRIGGER AS $$
DECLARE
  detected_obj jsonb;
BEGIN
  -- Process each detected object
  FOR detected_obj IN SELECT jsonb_array_elements(NEW.detected_objects)
  LOOP
    -- Only process objects with high confidence
    IF (detected_obj->>'confidence')::float > 0.8 THEN
      -- Insert BIM element based on detected object
      INSERT INTO public.bim_elements (
        upload_id,
        element_type,
        name,
        description,
        geometry,
        parameters
      ) VALUES (
        NEW.upload_id,
        CASE 
          WHEN detected_obj->>'label' = 'wall' THEN 'wall'::element_type
          WHEN detected_obj->>'label' = 'door' THEN 'door'::element_type
          WHEN detected_obj->>'label' = 'window' THEN 'window'::element_type
          WHEN detected_obj->>'label' = 'beam' THEN 'beam'::element_type
          WHEN detected_obj->>'label' = 'column' THEN 'column'::element_type
          ELSE 'structural'::element_type
        END,
        concat('Auto-detected ', detected_obj->>'label'),
        concat('Automatically generated from object detection with ', 
               round((detected_obj->>'confidence')::numeric * 100, 1), '% confidence'),
        jsonb_build_object(
          'bbox', detected_obj->'bbox',
          'dimensions', detected_obj->'dimensions',
          'position', detected_obj->'position'
        ),
        jsonb_build_object(
          'confidence', detected_obj->>'confidence',
          'detection_method', 'auto',
          'source', 'object_detection'
        )
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS auto_bim_generation_trigger ON public.detection_results;
CREATE TRIGGER auto_bim_generation_trigger
  AFTER INSERT ON public.detection_results
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_bim_elements();

-- Function to update document export status tracking
CREATE OR REPLACE FUNCTION public.track_document_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Log document generation milestones
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS document_progress_trigger ON public.document_exports;
CREATE TRIGGER document_progress_trigger
  BEFORE UPDATE ON public.document_exports
  FOR EACH ROW
  EXECUTE FUNCTION public.track_document_progress();

-- Function to manage FEA analysis lifecycle
CREATE OR REPLACE FUNCTION public.manage_fea_lifecycle()
RETURNS TRIGGER AS $$
BEGIN
  -- Set timestamps based on status changes
  IF NEW.status = 'running' AND OLD.status != 'running' THEN
    NEW.started_at = now();
  ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS fea_lifecycle_trigger ON public.fea_analyses;
CREATE TRIGGER fea_lifecycle_trigger
  BEFORE UPDATE ON public.fea_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.manage_fea_lifecycle();

-- ========================================
-- CLEANUP AND MAINTENANCE FUNCTIONS
-- ========================================

-- Function to cleanup old presence records (call via cron)
CREATE OR REPLACE FUNCTION public.cleanup_old_presence()
RETURNS void AS $$
BEGIN
  DELETE FROM public.user_presence 
  WHERE last_seen < now() - interval '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive old compliance checks (call via cron)
CREATE OR REPLACE FUNCTION public.archive_old_compliance_checks()
RETURNS void AS $$
BEGIN
  -- Archive compliance checks older than 90 days
  UPDATE public.compliance_checks 
  SET metadata = metadata || jsonb_build_object('archived', true)
  WHERE started_at < now() - interval '90 days' 
  AND (metadata->>'archived') IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
