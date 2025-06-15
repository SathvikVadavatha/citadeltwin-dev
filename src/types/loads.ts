
export interface LoadCalculationParameters {
  // Building geometry
  buildingHeight: number; // m
  buildingWidth: number; // m
  buildingLength: number; // m
  floorHeight: number; // m
  numberOfFloors: number;
  
  // Location data
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  zipCode: string;
  
  // Building characteristics
  occupancyType: 'residential' | 'commercial' | 'industrial' | 'institutional';
  structuralSystem: 'steel_frame' | 'concrete_frame' | 'wood_frame' | 'masonry' | 'composite';
  roofType: 'flat' | 'gabled' | 'hipped' | 'shed';
  exposureCategory: 'B' | 'C' | 'D'; // Wind exposure
  
  // Code parameters
  buildingCode: 'IBC2021' | 'IBC2018' | 'IBC2015';
  seismicDesignCategory: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  windSpeedCategory: number; // mph, ultimate wind speed
}

export interface LoadResult {
  loadType: 'dead' | 'live' | 'wind' | 'seismic' | 'snow' | 'rain';
  magnitude: number; // N or N/m² depending on distribution
  direction: { x: number; y: number; z: number };
  distribution: 'point' | 'distributed' | 'line';
  location: { x: number; y: number; z: number };
  codeReference: string;
  safetyFactor: number;
  description: string;
}

export interface LoadCombination {
  name: string;
  description: string;
  factors: Record<string, number>; // load type -> factor
  codeReference: string;
  category: 'strength' | 'serviceability' | 'special';
}

export interface LoadCalculationResult {
  parameters: LoadCalculationParameters;
  individualLoads: LoadResult[];
  loadCombinations: LoadCombination[];
  summary: {
    totalDeadLoad: number;
    totalLiveLoad: number;
    maxWindLoad: number;
    maxSeismicLoad: number;
    governingCombination: string;
    maxCombinedLoad: number;
  };
  codeCompliance: {
    isCompliant: boolean;
    warnings: string[];
    references: string[];
  };
  calculationTimestamp: string;
}

// Standard load combinations per IBC
export const LOAD_COMBINATIONS_IBC = {
  strength: [
    {
      name: "1.4D",
      description: "Dead load only",
      factors: { dead: 1.4 },
      codeReference: "IBC 1605.2.1",
      category: "strength" as const
    },
    {
      name: "1.2D + 1.6L + 0.5(Lr or S or R)",
      description: "Dead + Live + Roof/Snow/Rain",
      factors: { dead: 1.2, live: 1.6, roof: 0.5, snow: 0.5, rain: 0.5 },
      codeReference: "IBC 1605.2.1",
      category: "strength" as const
    },
    {
      name: "1.2D + 1.6(Lr or S or R) + (L or 0.5W)",
      description: "Dead + Roof/Snow/Rain + Live or Wind",
      factors: { dead: 1.2, roof: 1.6, snow: 1.6, rain: 1.6, live: 1.0, wind: 0.5 },
      codeReference: "IBC 1605.2.1",
      category: "strength" as const
    },
    {
      name: "1.2D + 1.0W + L + 0.5(Lr or S or R)",
      description: "Dead + Wind + Live + Roof/Snow/Rain",
      factors: { dead: 1.2, wind: 1.0, live: 1.0, roof: 0.5, snow: 0.5, rain: 0.5 },
      codeReference: "IBC 1605.2.1",
      category: "strength" as const
    },
    {
      name: "1.2D + 1.0E + L + 0.2S",
      description: "Dead + Seismic + Live + Snow",
      factors: { dead: 1.2, seismic: 1.0, live: 1.0, snow: 0.2 },
      codeReference: "IBC 1605.2.1",
      category: "strength" as const
    },
    {
      name: "0.9D + 1.0W",
      description: "Reduced Dead + Wind (uplift check)",
      factors: { dead: 0.9, wind: 1.0 },
      codeReference: "IBC 1605.2.1",
      category: "strength" as const
    },
    {
      name: "0.9D + 1.0E",
      description: "Reduced Dead + Seismic (uplift check)",
      factors: { dead: 0.9, seismic: 1.0 },
      codeReference: "IBC 1605.2.1",
      category: "strength" as const
    }
  ],
  serviceability: [
    {
      name: "D + L",
      description: "Dead + Live (serviceability)",
      factors: { dead: 1.0, live: 1.0 },
      codeReference: "IBC 1605.2.2",
      category: "serviceability" as const
    },
    {
      name: "D + 0.75L + 0.75(Lr or S or R)",
      description: "Dead + Reduced Live + Roof/Snow/Rain",
      factors: { dead: 1.0, live: 0.75, roof: 0.75, snow: 0.75, rain: 0.75 },
      codeReference: "IBC 1605.2.2",
      category: "serviceability" as const
    }
  ]
};

// Occupancy live loads per IBC Table 1607.1
export const LIVE_LOADS_IBC = {
  residential: {
    dwelling_units: 40, // psf (1.92 kN/m²)
    hotels: 40,
    apartments: 40
  },
  commercial: {
    offices: 50, // psf (2.4 kN/m²)
    retail: 75,
    restaurants: 100,
    assembly_fixed_seats: 60,
    assembly_movable_seats: 100
  },
  industrial: {
    light_manufacturing: 125, // psf (6.0 kN/m²)
    heavy_manufacturing: 250,
    warehouses: 125
  },
  institutional: {
    hospitals: 40, // psf (1.92 kN/m²)
    schools: 40,
    libraries: 60
  }
};
