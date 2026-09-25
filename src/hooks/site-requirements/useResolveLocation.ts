import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReqProject {
  id: string;
  input_address: string;
  input_zip: string | null;
  property_type: 'residential' | 'commercial';
  state_code: string | null;
  state_name: string | null;
  county_name: string | null;
  place_name: string | null;
  fips_code: string | null;
  latitude: number | null;
  longitude: number | null;
  geocode_source: string | null;
  geocode_match_quality: 'exact' | 'approximate' | 'failed' | null;
  resolved_at: string | null;
}

export interface ReqSiteCondition {
  id: string;
  project_id: string;
  criterion: string;
  label: string;
  value: string;
  unit: string | null;
  note: string | null;
  source: string;
  source_edition: string | null;
  source_url: string | null;
  retrieved_at: string;
}

export interface ResolveLocationResult {
  project: ReqProject;
  siteConditions: ReqSiteCondition[];
  warnings: string[];
}

export interface ResolveLocationInput {
  address: string;
  zip: string;
  propertyType: 'residential' | 'commercial';
}

export const useResolveLocation = () => {
  const mutation = useMutation({
    mutationFn: async (input: ResolveLocationInput) => {
      const { data, error } = await supabase.functions.invoke('resolve-location', {
        body: input,
      });

      if (error) {
        // supabase-js does not surface the function's JSON error body on
        // non-2xx by default — try to read it off the context response.
        // For FunctionsHttpError, context is the raw Response, so its status
        // tells us whether the function is deployed-but-erroring (any status,
        // with a 404 specifically meaning "no function by this name") versus
        // unreachable altogether (FunctionsFetchError, no Response at all).
        const context = (error as any)?.context;
        const status: number | undefined = typeof context?.status === 'number' ? context.status : undefined;

        let bodyError: string | undefined;
        if (context && typeof context.json === 'function') {
          try {
            const body = await context.json();
            if (typeof body?.error === 'string') {
              bodyError = body.error;
            }
          } catch {
            // non-JSON error body — no extra detail available
          }
        }

        let message: string;
        if (status === 404) {
          message = 'The requirements lookup function is not deployed.';
        } else if (status !== undefined) {
          message = bodyError
            ? `Requirements lookup service error (${status}): ${bodyError}`
            : `Requirements lookup service returned an error (status ${status}).`;
        } else {
          message = 'Could not reach the requirements lookup service. Check your network connection.';
        }
        throw new Error(message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data as ResolveLocationResult;
    },
  });

  return {
    resolveLocation: mutation.mutateAsync,
    result: mutation.data,
    isResolving: mutation.isPending,
    resolveError: mutation.error as Error | null,
    reset: mutation.reset,
  };
};
