
import { Loader } from '@googlemaps/js-api-loader';
import { supabase } from '@/integrations/supabase/client';

// @googlemaps/js-api-loader enforces a page-wide singleton: a second `new Loader(...)`
// with different options than the first throws "Loader must not be called again with
// different options." Every consumer in the Client Portal (AddressAutocompleteInput.tsx,
// useClientPortalProjectAnalysis.ts) must go through this one instance with one fixed
// set of options so they can never race each other into that conflict.
export type GoogleMapsApi = Awaited<ReturnType<Loader['load']>>;

let mapsPromise: Promise<GoogleMapsApi> | null = null;

export const loadGoogleMaps = (): Promise<GoogleMapsApi> => {
  if (!mapsPromise) {
    mapsPromise = supabase.functions
      .invoke('get-google-maps-key')
      .then(({ data, error }) => {
        if (error || !data?.apiKey) {
          throw new Error(error?.message || data?.error || 'Failed to load Google Maps API key');
        }
        const loader = new Loader({ apiKey: data.apiKey, version: 'weekly', libraries: ['places'] });
        return loader.load();
      })
      .catch((err) => {
        // Reset on any failure — missing key or the Loader singleton conflict — so the
        // next call (e.g. a user hitting Retry) gets a fresh attempt instead of replaying
        // this same cached rejection until a full page reload.
        mapsPromise = null;
        throw err;
      });
  }
  return mapsPromise;
};
