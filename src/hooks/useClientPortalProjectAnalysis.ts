
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdvancedGIS } from '@/hooks/useAdvancedGIS';
import { useBlueprintFileUpload } from '@/hooks/blueprint/useBlueprintFileUpload';
import { buildAnalysisSummary } from '@/components/gis/utils/analysisSummary';
import { callBlueprintPipeline, decodeGlbBase64 } from '@/lib/blueprintPipeline';
import { loadGoogleMaps } from '@/lib/googleMapsLoader';
import { ClientPortalProject, ClientPortalRoomResults, ClientPortalComplianceResults } from './clientPortalTypes';
import type { Json } from '@/integrations/supabase/types';
import type { AnalysisSummary } from '@/components/gis/utils/analysisSummary';

// US addresses end in a 5-digit ZIP, optionally ZIP+4 — take the 5-digit part.
const extractZip = (address: string): string => {
  const match = address.match(/(\d{5})(?:-\d{4})?\s*$/);
  return match ? match[1] : '';
};

// Site & Federal Requirements' own propertyType is only 'residential' | 'commercial'
// — industrial (and anything else) is treated as commercial for now.
const mapToRequirementsPropertyType = (buildingType: string | null): 'residential' | 'commercial' =>
  buildingType === 'residential' ? 'residential' : 'commercial';

// Mirrors GoogleMapsGIS.tsx's extractLocationFromPlace() city/state extraction exactly —
// gis_layers rows are keyed by these strings, so drift here means buildAnalysisSummary
// silently finds no matching rows. Keep in sync if that logic ever changes.
const extractCityState = (
  components: google.maps.GeocoderAddressComponent[] | undefined
): { city: string; state: string } => {
  let city = '';
  let state = '';

  for (const component of components || []) {
    const types = component.types || [];
    if (!city && (types.includes('locality') || types.includes('postal_town'))) {
      city = component.long_name;
    } else if (!city && types.includes('sublocality')) {
      city = component.long_name;
    } else if (!city && types.includes('administrative_area_level_2')) {
      city = component.long_name;
    }
    if (!state && types.includes('administrative_area_level_1')) {
      state = component.short_name;
    }
  }

  return { city: city || 'Unknown', state };
};

const resolveCityState = async (lat: number, lng: number): Promise<{ city: string; state: string }> => {
  const googleMaps = await loadGoogleMaps();
  const geocoder = new googleMaps.maps.Geocoder();

  const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === googleMaps.maps.GeocoderStatus.OK && results && results.length > 0) {
        resolve(results);
      } else {
        reject(new Error(`Reverse geocoding failed: ${status}`));
      }
    });
  });

  return extractCityState(results[0].address_components);
};

const toErrorMessage = (err: unknown): string => (err instanceof Error ? err.message : String(err));

export interface RunAnalysisOutcome {
  // Reflects only the core (room/3D) analysis — GIS is independent and never
  // flips this to 'failed' on its own. See the status derivation below.
  status: 'complete' | 'failed';
  errorMessage: string | null;
}

/**
 * Reproduces the Client Portal's GIS + room analysis by calling the exact same
 * functions the GIS page and upload flow use, then saves the results into
 * client_portal_project_results. Does not render anything and never touches
 * the GIS or upload pages.
 *
 * Room/3D (YOLO) and GIS are independent of each other and run in parallel —
 * GIS doesn't need the blueprint pipeline's output, and the pipeline doesn't
 * need GIS's — so neither should block or be aborted by the other.
 */
export const useClientPortalProjectAnalysis = () => {
  const { uploadFile } = useBlueprintFileUpload();
  const { fetchFEMAFloodData, fetchEnvironmentalData } = useAdvancedGIS();

  const runAnalysis = useCallback(
    async (
      project: ClientPortalProject,
      resultsId: string,
      file?: File | null
    ): Promise<RunAnalysisOutcome> => {
      const roomErrors: string[] = [];
      const gisErrors: string[] = [];
      const requirementsErrors: string[] = [];
      let gisResults: AnalysisSummary | null = null;
      let roomResults: ClientPortalRoomResults | null = null;
      let model3DUrl: string | null = null;
      let complianceResults: ClientPortalComplianceResults | null = null;

      // Room + 3D analysis — reuses the exact same YOLO + EasyOCR pipeline call
      // BlueprintUpload.tsx's trigger3DGeneration makes (same URL, same request
      // body, same response fields), via the shared src/lib/blueprintPipeline.ts.
      const roomAnalysisPromise = (async () => {
        // Upload only happens on the first run, when a fresh File is available.
        // Retries reuse the publicUrl already persisted on the project row.
        let publicUrl: string | null = project.blueprint_public_url ?? null;

        if (file) {
          try {
            const uploadData = await uploadFile(file);
            if (!uploadData) throw new Error('Blueprint upload failed');

            publicUrl = uploadData.publicUrl;

            const { error: urlError } = await supabase
              .from('client_portal_projects')
              .update({ blueprint_public_url: publicUrl })
              .eq('id', project.id);
            if (urlError) throw urlError;
          } catch (err) {
            roomErrors.push(`Blueprint upload failed: ${toErrorMessage(err)}`);
            publicUrl = null;
          }
        }

        if (!publicUrl) {
          roomErrors.push('Room analysis skipped: no blueprint image available.');
          return;
        }

        try {
          const pipelineResult = await callBlueprintPipeline(publicUrl);
          const rooms = Array.isArray(pipelineResult.rooms) ? pipelineResult.rooms : [];

          roomResults = {
            rooms,
            roomCount: rooms.length,
            walls: pipelineResult.metadata?.walls,
            scale: pipelineResult.metadata?.scale,
            building: pipelineResult.metadata?.building,
          };

          // 3D model save is non-blocking: a missing/failed GLB doesn't fail the
          // project as long as rooms came back — model_3d_url is simply left null.
          if (pipelineResult.glb_base64) {
            try {
              const glbBytes = decodeGlbBase64(pipelineResult.glb_base64);
              const fileName = `client-portal/${project.id}/model_${Date.now()}.glb`;

              const { error: glbUploadError } = await supabase.storage
                .from('3d-models')
                .upload(fileName, glbBytes, { contentType: 'model/gltf-binary', upsert: true });
              if (glbUploadError) throw glbUploadError;

              const { data: urlData } = supabase.storage.from('3d-models').getPublicUrl(fileName);
              model3DUrl = urlData?.publicUrl ?? null;
            } catch (err) {
              console.error('3D model save failed (non-critical):', toErrorMessage(err));
            }
          }
        } catch (err) {
          roomErrors.push(`Room analysis failed: ${toErrorMessage(err)}`);
        }
      })();

      // GIS analysis — reverse geocode, then reuse the exact real-gis-integration
      // calls + buildAnalysisSummary() from the GIS page. Independent of the
      // room/3D pipeline above: it starts immediately instead of waiting on it.
      const gisAnalysisPromise = (async () => {
        if (project.latitude == null || project.longitude == null) {
          gisErrors.push('GIS analysis skipped: project has no coordinates.');
          return;
        }

        try {
          const { city, state } = await resolveCityState(project.latitude, project.longitude);

          await Promise.all([
            fetchFEMAFloodData({ city, state, latitude: project.latitude, longitude: project.longitude }),
            fetchEnvironmentalData({
              city,
              state,
              dataTypes: ['protected_lands'],
              latitude: project.latitude,
              longitude: project.longitude,
            }),
            fetchEnvironmentalData({
              city,
              state,
              dataTypes: ['soils_wetlands'],
              latitude: project.latitude,
              longitude: project.longitude,
            }),
          ]);

          const { data: layers, error: layersError } = await supabase
            .from('gis_layers')
            .select('*')
            .in('layer_type', ['flood_zones', 'environmental', 'zoning']);
          if (layersError) throw layersError;

          gisResults = buildAnalysisSummary(layers || [], city, state, project.latitude, project.longitude);
        } catch (err) {
          gisErrors.push(`GIS analysis failed: ${toErrorMessage(err)}`);
        }
      })();

      // Site & Federal Requirements — reuses the exact resolve-location edge
      // function the Site & Federal Requirements page calls via useResolveLocation.ts
      // (same request body shape). Called directly here since this is a plain
      // function, not a component that can call a hook. Independent of room/3D
      // and GIS: it starts immediately and a failure here never blocks either.
      const requirementsAnalysisPromise = (async () => {
        if (!project.site_address) {
          requirementsErrors.push('Site & federal requirements skipped: project has no address.');
          return;
        }

        const zip = extractZip(project.site_address);
        const propertyType = mapToRequirementsPropertyType(project.building_type);

        try {
          const { data, error } = await supabase.functions.invoke('resolve-location', {
            body: { address: project.site_address, zip, propertyType },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);

          complianceResults = {
            project: data.project,
            siteConditions: data.siteConditions ?? [],
            warnings: data.warnings ?? [],
            propertyType,
          };
        } catch (err) {
          requirementsErrors.push(`Site & federal requirements failed: ${toErrorMessage(err)}`);
        }
      })();

      // allSettled (rather than all/race) so a rejection on any one side doesn't
      // matter — each promise already catches its own errors internally, but
      // this keeps the parallel-and-independent contract explicit even if that
      // ever changes.
      await Promise.allSettled([roomAnalysisPromise, gisAnalysisPromise, requirementsAnalysisPromise]);

      // Core status reflects room/3D only — a GIS or requirements-lookup failure
      // never marks the whole project 'failed' when the core analysis succeeded.
      const coreStatus: 'complete' | 'failed' = roomErrors.length === 0 ? 'complete' : 'failed';
      const combinedErrors = [...roomErrors, ...gisErrors, ...requirementsErrors];
      const combinedError = combinedErrors.length ? combinedErrors.join(' | ') : null;

      const { error: saveError } = await supabase
        .from('client_portal_project_results')
        .update({
          gis_results: gisResults as unknown as Json,
          room_results: roomResults as unknown as Json,
          compliance_results: complianceResults as unknown as Json,
          model_3d_url: model3DUrl,
          processing_status: coreStatus,
          error_message: combinedError,
        })
        .eq('id', resultsId);

      if (saveError) {
        console.error('Failed to save client portal project analysis results:', saveError);
      }

      // Advance the project once the core analysis succeeds, regardless of
      // whether GIS succeeded — GIS is a secondary enrichment, not a gate.
      if (coreStatus === 'complete') {
        await supabase.from('client_portal_projects').update({ status: 'uploaded' }).eq('id', project.id);
      }

      return { status: coreStatus, errorMessage: combinedError };
    },
    [uploadFile, fetchFEMAFloodData, fetchEnvironmentalData]
  );

  return { runAnalysis };
};
