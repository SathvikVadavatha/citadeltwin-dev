import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResolveLocationRequest {
  address: string;
  zip?: string;
  propertyType: 'residential' | 'commercial';
}

interface GeocodeResult {
  latitude: number;
  longitude: number;
  stateCode: string | null;
  stateName: string | null;
  countyName: string | null;
  placeName: string | null;
  fipsCode: string | null;
  matchQuality: 'exact' | 'approximate';
}

// Finds a geographies layer by loose name match — the Census API's layer
// naming has shifted across vintages ("States" vs "2020 Census States").
function findLayer(geographies: Record<string, any>, needle: string): any[] {
  const key = Object.keys(geographies || {}).find((k) =>
    k.toLowerCase().includes(needle.toLowerCase())
  );
  return key ? geographies[key] : [];
}

async function geocodeAddress(address: string, zip?: string): Promise<GeocodeResult | null> {
  const oneLine = zip ? `${address}, ${zip}` : address;
  const url = new URL('https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress');
  url.searchParams.set('address', oneLine);
  url.searchParams.set('benchmark', 'Public_AR_Current');
  url.searchParams.set('vintage', 'Current_Current');
  url.searchParams.set('layers', 'all');
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Census geocoder returned ${res.status}`);
  }
  const json = await res.json();
  const matches = json?.result?.addressMatches;
  if (!Array.isArray(matches) || matches.length === 0) {
    return null;
  }

  const match = matches[0];
  const lon = match?.coordinates?.x;
  const lat = match?.coordinates?.y;
  const geographies = match?.geographies || {};

  const states = findLayer(geographies, 'states');
  const counties = findLayer(geographies, 'counties');
  const places = findLayer(geographies, 'incorporated places');

  const state = states?.[0];
  const county = counties?.[0];
  const place = places?.[0];

  const stateFips: string | undefined = state?.STATE;
  const countyFips: string | undefined = county?.COUNTY;
  const fipsCode = stateFips && countyFips ? `${stateFips}${countyFips}` : null;

  return {
    latitude: lat,
    longitude: lon,
    stateCode: state?.STUSAB ?? null,
    stateName: state?.NAME ?? null,
    countyName: county?.NAME ?? null,
    placeName: place?.NAME ?? null,
    fipsCode,
    // The Census one-line geocoder only ever returns "exact" (tiger-line
    // matched) results in addressMatches; anything looser doesn't match at all.
    matchQuality: matches.length > 1 ? 'approximate' : 'exact',
  };
}

interface SeismicResult {
  sdc: string;
  sds: number;
}

async function fetchSeismic(lat: number, lon: number): Promise<SeismicResult> {
  // The spec's original endpoint (ws/designmaps/asce7-22.json) now 308/301-redirects
  // here, via a plain-http intermediate hop — call the canonical URL directly.
  const url = new URL('https://earthquake.usgs.gov/ws/building-codes/asce7-22/calculate');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('riskCategory', 'II');
  url.searchParams.set('siteClass', 'D');
  url.searchParams.set('title', 'lookup');

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`USGS design maps returned ${res.status}`);
  }
  const json = await res.json();
  const data = json?.response?.data ?? json?.data;
  if (!data || data.sdc == null || data.sds == null) {
    throw new Error('USGS response missing sdc/sds');
  }
  return { sdc: String(data.sdc), sds: Number(data.sds) };
}

interface FloodResult {
  zone: string;
  bfe: number | null;
  mapped: boolean;
}

async function fetchFlood(lat: number, lon: number): Promise<FloodResult> {
  const url = new URL('https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query');
  url.searchParams.set('geometry', `${lon},${lat}`);
  url.searchParams.set('geometryType', 'esriGeometryPoint');
  url.searchParams.set('inSR', '4326');
  url.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
  url.searchParams.set('outFields', 'FLD_ZONE,ZONE_SUBTY,STATIC_BFE');
  url.searchParams.set('returnGeometry', 'false');
  url.searchParams.set('f', 'json');

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`FEMA NFHL returned ${res.status}`);
  }
  const json = await res.json();
  if (json?.error) {
    throw new Error(`FEMA NFHL error: ${json.error.message ?? 'unknown'}`);
  }
  const feature = json?.features?.[0];
  if (!feature) {
    return { zone: 'Not mapped', bfe: null, mapped: false };
  }
  const attrs = feature.attributes ?? {};
  const bfeRaw = attrs.STATIC_BFE;
  const bfe = typeof bfeRaw === 'number' && bfeRaw !== -9999 ? bfeRaw : null;
  return { zone: String(attrs.FLD_ZONE ?? 'Unknown'), bfe, mapped: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '');

    // req_projects rows are only ever readable by their owner (RLS: auth.uid() =
    // user_id) — a null user_id would insert a row nobody, including the
    // caller, could ever read back. So a resolvable user is required here,
    // not merely a valid Supabase JWT (verify_jwt also accepts the public
    // anon key, which resolves to no user).
    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await anonClient.auth.getUser(token);
      userId = user?.id ?? null;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Authentication required to look up site requirements.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { address, zip, propertyType }: ResolveLocationRequest = await req.json();

    if (!address || !propertyType) {
      return new Response(
        JSON.stringify({ error: 'address and propertyType are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 4.1 Geocode — a failed geocode is fatal, we never guess a location.
    let geocode: GeocodeResult | null;
    try {
      geocode = await geocodeAddress(address, zip);
    } catch (err) {
      console.error('Geocode request failed:', err);
      return new Response(
        JSON.stringify({ error: 'Geocoding service unavailable', details: err instanceof Error ? err.message : String(err) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      );
    }

    if (!geocode) {
      return new Response(
        JSON.stringify({ error: 'Could not resolve this address. Check the address and ZIP and try again.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 422 }
      );
    }

    // 4.4 Persist the project row first — site conditions hang off its id.
    const { data: project, error: projectError } = await serviceClient
      .from('req_projects')
      .insert({
        user_id: userId,
        input_address: address,
        input_zip: zip ?? null,
        property_type: propertyType,
        state_code: geocode.stateCode,
        state_name: geocode.stateName,
        county_name: geocode.countyName,
        place_name: geocode.placeName,
        fips_code: geocode.fipsCode,
        latitude: geocode.latitude,
        longitude: geocode.longitude,
        geocode_source: 'census',
        geocode_match_quality: geocode.matchQuality,
        resolved_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (projectError || !project) {
      console.error('Failed to insert req_projects row:', projectError);
      return new Response(
        JSON.stringify({ error: 'Failed to save project', details: projectError?.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // 4.5 Each hazard call is independent — one failing must not hide the others.
    const siteConditions: Array<Record<string, unknown>> = [];
    const warnings: string[] = [];

    try {
      const seismic = await fetchSeismic(geocode.latitude, geocode.longitude);
      siteConditions.push({
        project_id: project.id,
        criterion: 'seismic_design_category',
        label: 'Seismic design category',
        value: seismic.sdc,
        unit: null,
        note: `SDS ${seismic.sds} g. Risk Category II and Site Class D are assumed defaults — the actual project's risk category and site class have not been supplied.`,
        source: 'USGS',
        source_edition: 'ASCE 7-22',
        source_url: 'https://earthquake.usgs.gov/ws/building-codes/asce7-22/calculate',
      });
      siteConditions.push({
        project_id: project.id,
        criterion: 'seismic_sds',
        label: 'Seismic SDS (design spectral acceleration)',
        value: String(seismic.sds),
        unit: 'g',
        note: 'Risk Category II and Site Class D are assumed defaults.',
        source: 'USGS',
        source_edition: 'ASCE 7-22',
        source_url: 'https://earthquake.usgs.gov/ws/building-codes/asce7-22/calculate',
      });
    } catch (err) {
      console.error('USGS seismic lookup failed:', err);
      const reason = err instanceof Error ? err.message : String(err);
      warnings.push(`Seismic data unavailable: ${reason}`);
      siteConditions.push({
        project_id: project.id,
        criterion: 'seismic_design_category',
        label: 'Seismic design category',
        value: 'Unavailable',
        unit: null,
        note: `Could not retrieve from USGS: ${reason}`,
        source: 'USGS',
        source_edition: 'ASCE 7-22',
        source_url: 'https://earthquake.usgs.gov/ws/building-codes/asce7-22/calculate',
      });
    }

    try {
      const flood = await fetchFlood(geocode.latitude, geocode.longitude);
      siteConditions.push({
        project_id: project.id,
        criterion: 'flood_zone',
        label: 'FEMA flood zone',
        value: flood.zone,
        unit: null,
        note: flood.mapped
          ? (flood.bfe != null ? `Base flood elevation ${flood.bfe} ft.` : 'Base flood elevation not available for this location.')
          : 'No NFHL feature intersects this point. NFHL coverage is incomplete in some areas — this is not a statement that the site has no flood risk.',
        source: 'FEMA',
        source_edition: 'NFHL',
        source_url: 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28',
      });
    } catch (err) {
      console.error('FEMA flood lookup failed:', err);
      const reason = err instanceof Error ? err.message : String(err);
      warnings.push(`Flood data unavailable: ${reason}`);
      siteConditions.push({
        project_id: project.id,
        criterion: 'flood_zone',
        label: 'FEMA flood zone',
        value: 'Unavailable',
        unit: null,
        note: `Could not retrieve from FEMA NFHL: ${reason}`,
        source: 'FEMA',
        source_edition: 'NFHL',
        source_url: 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28',
      });
    }

    // Wind speed, ground snow load, and ice thickness are deliberately not
    // fetched yet: the ASCE Hazard Tool / ATC Hazards by Location terms of
    // use need review before we call those services. req_site_conditions
    // already has room for these criteria once that's cleared.

    const { data: insertedConditions, error: conditionsError } = await serviceClient
      .from('req_site_conditions')
      .insert(siteConditions)
      .select();

    if (conditionsError) {
      console.error('Failed to insert req_site_conditions rows:', conditionsError);
      return new Response(
        JSON.stringify({ error: 'Failed to save site conditions', details: conditionsError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        project,
        siteConditions: insertedConditions,
        warnings,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Unhandled error in resolve-location:', error);
    return new Response(
      JSON.stringify({
        error: 'resolve-location failed',
        details: error instanceof Error ? error.message : String(error),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
