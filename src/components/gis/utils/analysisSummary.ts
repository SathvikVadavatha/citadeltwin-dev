// Shared analysis-summary helpers used by GoogleMapsGIS (risk overlay card)
// and GISSidebar (Results Panel + PDF export).

export type FloodRiskLevel = 'HIGH' | 'MODERATE' | 'LOW' | 'UNKNOWN';

export interface FloodSummary {
  riskLevel: FloodRiskLevel;
  zoneCount: number;
  highestZone: string | null;
  explanation: string;
  isReal: boolean;
}

export interface ProtectedSummary {
  count: number;
  closest: Array<{ name: string; type: string; agency: string; distanceMiles: number | null }>;
  isReal: boolean;
}

export interface SoilsWetlandsSummary {
  dominantSoil: string | null;
  wetlandsPresent: boolean;
  wetlandTypes: string[];
  isReal: boolean;
}

export interface SuitabilityScore {
  score: number;
  color: 'green' | 'yellow' | 'red';
}

export interface AnalysisSummary {
  flood: FloodSummary;
  protected: ProtectedSummary;
  soils: SoilsWetlandsSummary;
  suitability: SuitabilityScore;
}

const HIGH_RISK_ZONES = ['AE', 'VE', 'AH', 'AO', 'A'];
const COASTAL_ZONES = ['VE', 'V'];

export const floodZoneExplanation = (zone: string | null): string => {
  if (!zone) return 'No flood data available for this area';
  const z = zone.toUpperCase();
  if (z.includes('VE') || z === 'V') return 'Very high risk — coastal with wave action';
  if (z.includes('AE')) return 'High risk — 1% annual chance of flooding';
  if (z.includes('AH')) return 'High risk — shallow flooding 1-3 feet';
  if (z.includes('AO')) return 'High risk — sheet flow flooding 1-3 feet';
  if (z === 'A' || z.startsWith('A')) return 'High risk — no base flood elevation determined';
  if (z.includes('X500')) return 'Moderate risk — 0.2% annual chance flood hazard';
  if (z.includes('X')) return 'Minimal flood risk';
  return 'No flood data available for this area';
};

export const constructionImplications = (zone: string | null): string => {
  if (!zone) return 'No flood data available for this area.';
  const z = zone.toUpperCase();
  if (z.includes('VE') || z === 'V') {
    return 'Coastal high hazard area. Open foundation required. No fill allowed.';
  }
  if (z.includes('AE')) {
    return 'Flood insurance required for federally backed mortgages. Lowest floor must be at or above Base Flood Elevation.';
  }
  if (z === 'A' || z.startsWith('A')) {
    return 'Flood insurance required. BFE not established — contact local floodplain administrator.';
  }
  if (z.includes('X')) {
    return 'Standard homeowner insurance may cover flooding. No special construction requirements.';
  }
  return 'No special construction requirements documented for this zone.';
};

// Plain-English label for Cowardin wetland codes
// (https://www.fws.gov/wetlands/data/wetland-codes.html)
export const cowardinPlainEnglish = (code: string | null | undefined): string => {
  if (!code) return 'Wetland';
  const c = String(code).toUpperCase();
  const sysMap: Record<string, string> = {
    P: 'Palustrine',
    L: 'Lacustrine',
    R: 'Riverine',
    M: 'Marine',
    E: 'Estuarine'
  };
  const clsMap: Record<string, string> = {
    FO: 'Forested Wetland',
    SS: 'Scrub-Shrub Wetland',
    EM: 'Emergent Wetland',
    UB: 'Unconsolidated Bottom',
    AB: 'Aquatic Bed',
    SB: 'Streambed',
    RB: 'Rock Bottom',
    US: 'Unconsolidated Shore'
  };
  const system = sysMap[c.charAt(0)] || '';
  const klass = clsMap[c.substring(1, 3)] || '';
  if (system && klass) return `${system} ${klass}`;
  return klass || system || c;
};

const matchesLocation = (layer: any, city: string, state: string): boolean =>
  !!layer.city &&
  layer.city.toLowerCase() === city.toLowerCase() &&
  layer.state === state;

const parseGeometry = (raw: any): any => {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
};

const haversineMiles = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
};

const featureCentroid = (feature: any): { lat: number; lng: number } | null => {
  const geom = feature?.geometry;
  if (!geom) return null;
  const ring: number[][] | undefined =
    geom.type === 'Polygon'
      ? geom.coordinates?.[0]
      : geom.type === 'MultiPolygon'
        ? geom.coordinates?.[0]?.[0]
        : undefined;
  if (!ring || ring.length === 0) return null;
  let sumLat = 0;
  let sumLng = 0;
  for (const [lng, lat] of ring) {
    sumLat += lat;
    sumLng += lng;
  }
  return { lat: sumLat / ring.length, lng: sumLng / ring.length };
};

export function buildFloodSummary(
  environmentalLayers: any[],
  city: string,
  state: string
): FloodSummary {
  const layer = environmentalLayers.find(
    (l) => l.layer_type === 'flood_zones' && matchesLocation(l, city, state)
  );
  if (!layer) {
    return {
      riskLevel: 'UNKNOWN',
      zoneCount: 0,
      highestZone: null,
      explanation: floodZoneExplanation(null),
      isReal: false
    };
  }

  const geom = parseGeometry(layer.geometry_data);
  const features: any[] = Array.isArray(geom?.features) ? geom.features : [];

  let highest: string | null = null;
  let riskLevel: FloodRiskLevel = 'LOW';

  for (const feature of features) {
    const zone = String(feature?.properties?.FLD_ZONE ?? '').toUpperCase();
    if (!zone) continue;

    if (COASTAL_ZONES.some((c) => zone.includes(c))) {
      highest = zone;
      riskLevel = 'HIGH';
      break;
    }
    if (HIGH_RISK_ZONES.some((c) => zone.includes(c))) {
      highest = highest && riskLevel === 'HIGH' ? highest : zone;
      riskLevel = 'HIGH';
    } else if (zone.includes('X500') && riskLevel !== 'HIGH') {
      highest = highest || zone;
      riskLevel = 'MODERATE';
    } else if (zone.includes('X') && riskLevel === 'LOW') {
      highest = highest || zone;
    }
  }

  if (features.length === 0) {
    return {
      riskLevel: 'UNKNOWN',
      zoneCount: 0,
      highestZone: null,
      explanation: floodZoneExplanation(null),
      isReal: !!layer.metadata?.is_real_data
    };
  }

  return {
    riskLevel,
    zoneCount: features.length,
    highestZone: highest,
    explanation: floodZoneExplanation(highest),
    isReal: !!layer.metadata?.is_real_data
  };
}

export function buildProtectedSummary(
  environmentalLayers: any[],
  city: string,
  state: string,
  searchLat?: number,
  searchLng?: number
): ProtectedSummary {
  const layer = environmentalLayers.find(
    (l) => l.environmental_type === 'protected_lands' && matchesLocation(l, city, state)
  );
  if (!layer) {
    return { count: 0, closest: [], isReal: false };
  }

  const geom = parseGeometry(layer.geometry_data);
  const features: any[] = Array.isArray(geom?.features) ? geom.features : [];

  const enriched = features.map((feature) => {
    const centroid = featureCentroid(feature);
    let distanceMiles: number | null = null;
    if (centroid && typeof searchLat === 'number' && typeof searchLng === 'number') {
      distanceMiles = haversineMiles(searchLat, searchLng, centroid.lat, centroid.lng);
    }
    return {
      name: String(feature?.properties?.Unit_Nm ?? 'Protected Area'),
      type: String(feature?.properties?.Des_Tp ?? 'Protected Land'),
      agency: String(feature?.properties?.Mang_Name ?? feature?.properties?.Loc_Own ?? 'Unknown'),
      distanceMiles
    };
  });

  enriched.sort((a, b) => {
    if (a.distanceMiles === null) return 1;
    if (b.distanceMiles === null) return -1;
    return a.distanceMiles - b.distanceMiles;
  });

  return {
    count: features.length,
    closest: enriched.slice(0, 3),
    isReal: !!layer.metadata?.is_real_data
  };
}

export function buildSoilsWetlandsSummary(
  environmentalLayers: any[],
  city: string,
  state: string
): SoilsWetlandsSummary {
  const soils = environmentalLayers.find(
    (l) => l.environmental_type === 'soils' && matchesLocation(l, city, state)
  );
  const wetlands = environmentalLayers.find(
    (l) => l.environmental_type === 'wetlands' && matchesLocation(l, city, state)
  );

  let dominantSoil: string | null = null;
  if (soils) {
    const geom = parseGeometry(soils.geometry_data);
    const features: any[] = Array.isArray(geom?.features) ? geom.features : [];
    const counts: Record<string, number> = {};
    for (const f of features) {
      const name = String(f?.properties?.MUNAME ?? '').trim();
      if (!name) continue;
      counts[name] = (counts[name] || 0) + 1;
    }
    let bestCount = 0;
    for (const [name, count] of Object.entries(counts)) {
      if (count > bestCount) {
        bestCount = count;
        dominantSoil = name;
      }
    }
  }

  const wetlandTypes: string[] = [];
  let wetlandsPresent = false;
  if (wetlands) {
    const geom = parseGeometry(wetlands.geometry_data);
    const features: any[] = Array.isArray(geom?.features) ? geom.features : [];
    wetlandsPresent = features.length > 0;
    const seen = new Set<string>();
    for (const f of features) {
      const code = String(f?.properties?.WETLAND_TY ?? f?.properties?.WETLAND_TYPE ?? '').trim();
      if (!code) continue;
      const label = cowardinPlainEnglish(code);
      if (!seen.has(label)) {
        seen.add(label);
        wetlandTypes.push(label);
      }
    }
  }

  return {
    dominantSoil,
    wetlandsPresent,
    wetlandTypes: wetlandTypes.slice(0, 4),
    isReal: !!(soils?.metadata?.is_real_data || wetlands?.metadata?.is_real_data)
  };
}

// Site Suitability Score per spec:
// Start at 10; HIGH flood = -3; MODERATE flood = -1;
// protected area within 0.5 miles = -1; wetlands present = -1.
export function buildSuitabilityScore(
  flood: FloodSummary,
  prot: ProtectedSummary,
  soils: SoilsWetlandsSummary
): SuitabilityScore {
  let score = 10;
  if (flood.riskLevel === 'HIGH') score -= 3;
  else if (flood.riskLevel === 'MODERATE') score -= 1;

  const closeProtected = prot.closest.some(
    (p) => typeof p.distanceMiles === 'number' && p.distanceMiles <= 0.5
  );
  if (closeProtected) score -= 1;

  if (soils.wetlandsPresent) score -= 1;

  if (score < 0) score = 0;

  let color: 'green' | 'yellow' | 'red';
  if (score >= 8) color = 'green';
  else if (score >= 5) color = 'yellow';
  else color = 'red';

  return { score, color };
}

export function buildAnalysisSummary(
  environmentalLayers: any[],
  city: string,
  state: string,
  searchLat?: number,
  searchLng?: number
): AnalysisSummary {
  const flood = buildFloodSummary(environmentalLayers, city, state);
  const prot = buildProtectedSummary(environmentalLayers, city, state, searchLat, searchLng);
  const soils = buildSoilsWetlandsSummary(environmentalLayers, city, state);
  const suitability = buildSuitabilityScore(flood, prot, soils);

  return { flood, protected: prot, soils, suitability };
}

export const disasterIcon = (incidentType: string | null | undefined): string => {
  const t = String(incidentType || '').toLowerCase();
  if (t.includes('hurricane') || t.includes('typhoon')) return '🌀';
  if (t.includes('tornado')) return '🌪';
  if (t.includes('fire')) return '🔥';
  if (t.includes('flood')) return '🌊';
  if (t.includes('storm') || t.includes('rain') || t.includes('snow') || t.includes('blizzard')) return '⛈';
  return '📋';
};

export const disasterBadgeColor = (incidentType: string | null | undefined): string => {
  const t = String(incidentType || '').toLowerCase();
  if (t.includes('hurricane') || t.includes('typhoon')) return 'border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300';
  if (t.includes('tornado')) return 'border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300';
  if (t.includes('fire')) return 'border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300';
  if (t.includes('flood')) return 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300';
  if (t.includes('storm') || t.includes('rain') || t.includes('snow') || t.includes('blizzard')) return 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300';
  return 'border-muted-foreground/30 bg-muted text-muted-foreground';
};
