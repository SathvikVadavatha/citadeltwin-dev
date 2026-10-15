import { useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useUploads } from '@/hooks/useUploads';

interface Generated3DModelRef {
  id: string;
  model_file_path: string | null;
  generation_status: string | null;
  created_at: string;
}

interface UploadRow {
  id: string;
  original_filename: string;
  upload_status: string | null;
  generated_3d_models?: Generated3DModelRef[];
}

export interface AssistantDataContext {
  available: boolean;
  loadError: boolean;
  totalBlueprints: number;
  countsByStatus: Record<string, number>;
  noModelYet: string[];
  needsRegenerating: string[];
}

// Same "latest model / legacy blob: URL" detection already used by
// ViewBlueprints.tsx's getModelAction and useBlueprintModelGeneration.ts —
// duplicated here as plain data derivation (no UI), not a new DB query.
function latestModel(upload: UploadRow): Generated3DModelRef | undefined {
  const models = upload.generated_3d_models ?? [];
  return [...models].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
}

export function useAssistantDataContext(): AssistantDataContext {
  const { user } = useAuth();
  const { uploads, isLoading, error } = useUploads(user?.id);

  return useMemo(() => {
    if (isLoading || !uploads) {
      return {
        available: false,
        loadError: Boolean(error),
        totalBlueprints: 0,
        countsByStatus: {},
        noModelYet: [],
        needsRegenerating: [],
      };
    }

    const rows = uploads as UploadRow[];
    const countsByStatus: Record<string, number> = {};
    const noModelYet: string[] = [];
    const needsRegenerating: string[] = [];

    for (const upload of rows) {
      const status = upload.upload_status || 'unknown';
      countsByStatus[status] = (countsByStatus[status] || 0) + 1;

      const latest = latestModel(upload);
      if (!latest || latest.generation_status !== 'completed') {
        noModelYet.push(upload.original_filename);
      } else if (latest.model_file_path?.startsWith('blob:')) {
        needsRegenerating.push(upload.original_filename);
      }
    }

    return {
      available: true,
      loadError: Boolean(error),
      totalBlueprints: rows.length,
      countsByStatus,
      noModelYet,
      needsRegenerating,
    };
  }, [uploads, isLoading, error]);
}
