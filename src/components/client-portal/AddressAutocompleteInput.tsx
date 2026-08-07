import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2 } from 'lucide-react';

export interface ResolvedAddress {
  formattedAddress: string;
  lat: number;
  lng: number;
}

interface AddressAutocompleteInputProps {
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Pre-fills the input text, e.g. when editing a project that already has a resolved address. */
  defaultValue?: string;
  /** Called with the resolved place when the user picks a real suggestion (or presses Enter
   *  on text that geocodes to a real place), and with null whenever the text no longer
   *  matches a resolved place (e.g. the user edits it again). */
  onResolvedChange: (address: ResolvedAddress | null) => void;
}

// Same technique used by the GIS page (src/components/gis/GoogleMapsGIS.tsx): fetch the
// Maps key from the `get-google-maps-key` edge function, then attach Places Autocomplete
// to a plain input. Cached at module scope so re-mounting this input doesn't re-invoke the
// edge function or reload the script every time the modal opens.
let apiKeyPromise: Promise<string> | null = null;
const loadGoogleMapsApiKey = (): Promise<string> => {
  if (!apiKeyPromise) {
    apiKeyPromise = supabase.functions.invoke('get-google-maps-key').then(({ data, error }) => {
      if (error || !data?.apiKey) {
        apiKeyPromise = null;
        throw new Error(error?.message || data?.error || 'Failed to load Google Maps API key');
      }
      return data.apiKey as string;
    });
  }
  return apiKeyPromise;
};

export const AddressAutocompleteInput: React.FC<AddressAutocompleteInputProps> = ({
  id,
  placeholder = "Search any US address — e.g. '1600 Pennsylvania Ave, Washington, DC'",
  disabled,
  defaultValue,
  onResolvedChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const onResolvedChangeRef = useRef(onResolvedChange);
  onResolvedChangeRef.current = onResolvedChange;

  const [resolved, setResolved] = useState<ResolvedAddress | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMapsApiKey()
      .then((apiKey) => {
        const loader = new Loader({ apiKey, version: 'weekly', libraries: ['places'] });
        return loader.load();
      })
      .then((googleMaps: typeof google) => {
        if (cancelled || !inputRef.current) return;

        const autocomplete = new googleMaps.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode'],
          fields: ['geometry', 'formatted_address', 'name'],
          componentRestrictions: { country: 'us' },
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place.geometry?.location) {
            setResolved(null);
            onResolvedChangeRef.current(null);
            return;
          }
          const next: ResolvedAddress = {
            formattedAddress: place.formatted_address || place.name || '',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          setResolved(next);
          onResolvedChangeRef.current(next);
        });

        // Enter-key fallback for typed addresses that weren't picked from the dropdown —
        // mirrors the same fallback in GoogleMapsGIS.tsx so typed-and-confirmed text still
        // has to resolve to a real geocoded place, not just arbitrary text.
        inputRef.current.addEventListener('keydown', async (event: KeyboardEvent) => {
          if (event.key !== 'Enter') return;
          const address = (event.target as HTMLInputElement).value;
          if (!address || autocomplete.getPlace()?.geometry) return;

          event.preventDefault();
          const geocoder = new googleMaps.maps.Geocoder();
          try {
            const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
              geocoder.geocode(
                { address, componentRestrictions: { country: 'US' } },
                (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
                  if (status === googleMaps.maps.GeocoderStatus.OK && results) resolve(results);
                  else reject(new Error(`Geocoding failed: ${status}`));
                }
              );
            });

            if (results.length > 0) {
              const result = results[0];
              const next: ResolvedAddress = {
                formattedAddress: result.formatted_address,
                lat: result.geometry.location.lat(),
                lng: result.geometry.location.lng(),
              };
              setResolved(next);
              onResolvedChangeRef.current(next);
            }
          } catch {
            setResolved(null);
            onResolvedChangeRef.current(null);
          }
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load address search');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-1.5">
      <input
        ref={inputRef}
        id={id}
        type="text"
        placeholder={placeholder}
        disabled={disabled}
        defaultValue={defaultValue}
        onChange={() => {
          if (resolved) {
            setResolved(null);
            onResolvedChangeRef.current(null);
          }
        }}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
      />
      {resolved && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          {resolved.formattedAddress}
        </p>
      )}
      {loadError && <p className="text-xs text-destructive">{loadError}</p>}
    </div>
  );
};
