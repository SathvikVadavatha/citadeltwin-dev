
export interface LoadCalculationParameters {
  city: string;
  state: string;
  buildingType: string;
  occupancy: string;
  height: number;
  area: number;
  buildingCode?: string;
}

export interface LoadCalculationResult {
  calculationTimestamp: string;
  parameters: LoadCalculationParameters;
  individualLoads: Array<{
    loadType: string;
    description: string;
    magnitude: number;
    direction: { x: number; y: number; z: number };
    location: { x: number; y: number; z: number };
    codeReference: string;
    safetyFactor: number;
    distribution: string;
  }>;
  combinedLoads: Array<{
    combination: string;
    totalMagnitude: number;
    criticalLocation: { x: number; y: number; z: number };
  }>;
  loadCombinations?: Array<{
    name: string;
    equation: string;
    result: number;
  }>;
  summary: {
    totalDeadLoad: number;
    totalLiveLoad: number;
    totalWindLoad: number;
    totalSeismicLoad: number;
    maxWindLoad?: number;
    maxSeismicLoad?: number;
    governingCombination: string;
  };
  codeCompliance?: {
    compliant: boolean;
    violations: Array<{
      code: string;
      description: string;
      severity: 'warning' | 'error';
    }>;
    recommendations: string[];
  };
}
