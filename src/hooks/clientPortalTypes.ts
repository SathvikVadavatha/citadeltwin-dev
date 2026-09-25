
import type { AnalysisSummary } from '@/components/gis/utils/analysisSummary';
import type {
  BlueprintPipelineRoom,
  BlueprintPipelineWall,
  BlueprintPipelineScaleInfo,
  BlueprintPipelineBuildingInfo,
} from '@/lib/blueprintPipeline';
import type { ReqProject, ReqSiteCondition } from '@/hooks/site-requirements/useResolveLocation';

export interface ClientPortalProject {
  id: string;
  project_name: string;
  client_name: string;
  site_address: string | null;
  latitude: number | null;
  longitude: number | null;
  building_type: string | null;
  building_sub_type: string | null;
  blueprint_file_name: string | null;
  blueprint_file_size: number | null;
  blueprint_file_type: string | null;
  blueprint_public_url: string | null;
  status: string;
  feedback: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewClientPortalProject {
  projectName: string;
  clientName: string;
  siteAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  buildingType: string;
  buildingSubType: string;
  blueprintFileName: string | null;
  blueprintFileSize: number | null;
  blueprintFileType: string | null;
}

export interface UpdateClientPortalProject {
  projectName?: string;
  clientName?: string;
  siteAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  buildingType?: string;
  buildingSubType?: string;
  blueprintFileName?: string | null;
  blueprintFileSize?: number | null;
  blueprintFileType?: string | null;
  blueprintPublicUrl?: string | null;
  status?: string;
  feedback?: string | null;
}

export type ClientPortalProcessingStatus = 'pending' | 'running' | 'complete' | 'failed';

// Shape saved from the YOLO + EasyOCR pipeline's response (see src/lib/blueprintPipeline.ts).
export interface ClientPortalRoomResults {
  rooms: BlueprintPipelineRoom[];
  roomCount: number;
  walls?: BlueprintPipelineWall[];
  scale?: BlueprintPipelineScaleInfo;
  building?: BlueprintPipelineBuildingInfo;
}

// Saved from the Site & Federal Requirements feature's `resolve-location` edge
// function response (see supabase/functions/resolve-location/index.ts) — reuses
// that feature's own ReqProject/ReqSiteCondition shapes rather than redefining them.
export interface ClientPortalComplianceResults {
  project: ReqProject;
  siteConditions: ReqSiteCondition[];
  warnings: string[];
  propertyType: 'residential' | 'commercial';
}

export interface ClientPortalProjectResults {
  id: string;
  project_id: string;
  gis_results: AnalysisSummary | null;
  room_results: ClientPortalRoomResults | null;
  compliance_results: ClientPortalComplianceResults | null;
  model_3d_url: string | null;
  processing_status: ClientPortalProcessingStatus;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
