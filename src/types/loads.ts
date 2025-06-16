
export interface LoadCalculationResult {
  calculationTimestamp: string;
  parameters: {
    city: string;
    state: string;
    buildingType: string;
    occupancy: string;
    height: number;
    area: number;
  };
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
  summary: {
    totalDeadLoad: number;
    totalLiveLoad: number;
    totalWindLoad: number;
    totalSeismicLoad: number;
    governingCombination: string;
  };
}
