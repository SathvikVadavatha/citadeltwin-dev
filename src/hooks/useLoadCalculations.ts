
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { 
  LoadCalculationParameters, 
  LoadCalculationResult, 
  LoadResult,
  LOAD_COMBINATIONS_IBC,
  LIVE_LOADS_IBC 
} from '@/types/loads';

export const useLoadCalculations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [calculating, setCalculating] = useState(false);

  const calculateLoads = async (parameters: LoadCalculationParameters): Promise<LoadCalculationResult> => {
    setCalculating(true);
    
    try {
      const individualLoads: LoadResult[] = [];
      
      // Calculate Dead Loads
      const deadLoads = calculateDeadLoads(parameters);
      individualLoads.push(...deadLoads);
      
      // Calculate Live Loads
      const liveLoads = calculateLiveLoads(parameters);
      individualLoads.push(...liveLoads);
      
      // Calculate Wind Loads
      const windLoads = await calculateWindLoads(parameters);
      individualLoads.push(...windLoads);
      
      // Calculate Seismic Loads
      const seismicLoads = await calculateSeismicLoads(parameters);
      individualLoads.push(...seismicLoads);
      
      // Get applicable load combinations
      const loadCombinations = getLoadCombinations(parameters.buildingCode);
      
      // Calculate summary
      const summary = calculateLoadSummary(individualLoads, loadCombinations);
      
      // Check code compliance
      const codeCompliance = checkCodeCompliance(parameters, individualLoads);
      
      const result: LoadCalculationResult = {
        parameters,
        individualLoads,
        loadCombinations,
        summary,
        codeCompliance,
        calculationTimestamp: new Date().toISOString()
      };
      
      return result;
    } finally {
      setCalculating(false);
    }
  };

  const calculateDeadLoads = (params: LoadCalculationParameters): LoadResult[] => {
    const loads: LoadResult[] = [];
    const floorArea = params.buildingWidth * params.buildingLength;
    
    // Typical dead load values (psf converted to N/m²)
    const deadLoadIntensities = {
      steel_frame: 80 * 47.88, // 80 psf to N/m²
      concrete_frame: 120 * 47.88,
      wood_frame: 60 * 47.88,
      masonry: 100 * 47.88,
      composite: 85 * 47.88
    };
    
    const deadLoadIntensity = deadLoadIntensities[params.structuralSystem];
    
    // Floor dead loads
    for (let floor = 1; floor <= params.numberOfFloors; floor++) {
      loads.push({
        loadType: 'dead',
        magnitude: deadLoadIntensity,
        direction: { x: 0, y: 0, z: -1 },
        distribution: 'distributed',
        location: { x: params.buildingWidth/2, y: params.buildingLength/2, z: floor * params.floorHeight },
        codeReference: 'IBC Table 1607.1',
        safetyFactor: 1.4,
        description: `Floor ${floor} dead load - ${params.structuralSystem}`
      });
    }
    
    // Roof dead load
    const roofDeadLoad = params.roofType === 'flat' ? 25 * 47.88 : 20 * 47.88;
    loads.push({
      loadType: 'dead',
      magnitude: roofDeadLoad,
      direction: { x: 0, y: 0, z: -1 },
      distribution: 'distributed',
      location: { x: params.buildingWidth/2, y: params.buildingLength/2, z: params.numberOfFloors * params.floorHeight },
      codeReference: 'IBC Table 1607.1',
      safetyFactor: 1.4,
      description: `Roof dead load - ${params.roofType}`
    });
    
    return loads;
  };

  const calculateLiveLoads = (params: LoadCalculationParameters): LoadResult[] => {
    const loads: LoadResult[] = [];
    
    // Get live load intensity based on occupancy
    const liveLoadPsf = LIVE_LOADS_IBC[params.occupancyType]?.dwelling_units || 
                       LIVE_LOADS_IBC[params.occupancyType]?.offices || 
                       50; // Default to 50 psf
    
    const liveLoadIntensity = liveLoadPsf * 47.88; // Convert to N/m²
    
    // Floor live loads (not applied to roof typically)
    for (let floor = 1; floor <= params.numberOfFloors; floor++) {
      loads.push({
        loadType: 'live',
        magnitude: liveLoadIntensity,
        direction: { x: 0, y: 0, z: -1 },
        distribution: 'distributed',
        location: { x: params.buildingWidth/2, y: params.buildingLength/2, z: floor * params.floorHeight },
        codeReference: 'IBC Table 1607.1',
        safetyFactor: 1.6,
        description: `Floor ${floor} live load - ${params.occupancyType}`
      });
    }
    
    return loads;
  };

  const calculateWindLoads = async (params: LoadCalculationParameters): Promise<LoadResult[]> => {
    const loads: LoadResult[] = [];
    
    // Simplified wind load calculation (ASCE 7 method)
    const V = params.windSpeedCategory; // Ultimate wind speed
    const qz = 0.613 * Math.pow(V, 2) * 0.00256; // Velocity pressure at height z (kPa)
    
    // Wind pressure coefficients (simplified)
    const Cp_windward = 0.8;
    const Cp_leeward = -0.5;
    
    const windwardPressure = qz * Cp_windward * 1000; // Convert to N/m²
    const leewardPressure = qz * Cp_leeward * 1000;
    
    // Wind loads on each floor level
    for (let floor = 1; floor <= params.numberOfFloors; floor++) {
      const height = floor * params.floorHeight;
      const tributaryArea = params.buildingHeight * params.floorHeight;
      
      // Windward pressure
      loads.push({
        loadType: 'wind',
        magnitude: windwardPressure,
        direction: { x: 1, y: 0, z: 0 },
        distribution: 'distributed',
        location: { x: 0, y: params.buildingLength/2, z: height },
        codeReference: 'ASCE 7-16 Chapter 27',
        safetyFactor: 1.0,
        description: `Wind load - windward face, floor ${floor}`
      });
      
      // Leeward pressure
      loads.push({
        loadType: 'wind',
        magnitude: Math.abs(leewardPressure),
        direction: { x: -1, y: 0, z: 0 },
        distribution: 'distributed',
        location: { x: params.buildingWidth, y: params.buildingLength/2, z: height },
        codeReference: 'ASCE 7-16 Chapter 27',
        safetyFactor: 1.0,
        description: `Wind load - leeward face, floor ${floor}`
      });
    }
    
    return loads;
  };

  const calculateSeismicLoads = async (params: LoadCalculationParameters): Promise<LoadResult[]> => {
    const loads: LoadResult[] = [];
    
    // Simplified seismic load calculation
    const seismicCoefficients = {
      'A': 0.025,
      'B': 0.05,
      'C': 0.075,
      'D': 0.1,
      'E': 0.125,
      'F': 0.15
    };
    
    const C = seismicCoefficients[params.seismicDesignCategory];
    const W = calculateTotalWeight(params); // Total building weight
    
    // Base shear
    const V = C * W;
    
    // Distribute seismic forces to floor levels
    let totalHeight = 0;
    const floorWeights: number[] = [];
    
    for (let floor = 1; floor <= params.numberOfFloors; floor++) {
      const height = floor * params.floorHeight;
      totalHeight += height;
      
      // Estimate floor weight (simplified)
      const floorWeight = params.buildingWidth * params.buildingLength * 80 * 47.88 * 9.81; // N
      floorWeights.push(floorWeight);
    }
    
    // Calculate force at each level
    for (let floor = 1; floor <= params.numberOfFloors; floor++) {
      const height = floor * params.floorHeight;
      const wx = floorWeights[floor - 1];
      const wxhx = wx * height;
      
      let sumWihi = 0;
      for (let i = 0; i < params.numberOfFloors; i++) {
        sumWihi += floorWeights[i] * ((i + 1) * params.floorHeight);
      }
      
      const Fx = V * (wxhx / sumWihi);
      
      loads.push({
        loadType: 'seismic',
        magnitude: Fx,
        direction: { x: 1, y: 0, z: 0 },
        distribution: 'point',
        location: { x: params.buildingWidth/2, y: params.buildingLength/2, z: height },
        codeReference: 'ASCE 7-16 Chapter 12',
        safetyFactor: 1.0,
        description: `Seismic force - floor ${floor}, SDC ${params.seismicDesignCategory}`
      });
    }
    
    return loads;
  };

  const calculateTotalWeight = (params: LoadCalculationParameters): number => {
    // Simplified total weight calculation
    const floorArea = params.buildingWidth * params.buildingLength;
    const deadLoadPerFloor = 80 * 47.88 * 9.81; // N/m² * gravity
    const liveLoadReduction = 0.25; // 25% of live load for seismic
    const liveLoadPerFloor = 50 * 47.88 * 9.81 * liveLoadReduction;
    
    const totalFloorWeight = params.numberOfFloors * floorArea * (deadLoadPerFloor + liveLoadPerFloor);
    const roofWeight = floorArea * 25 * 47.88 * 9.81; // Roof dead load only
    
    return totalFloorWeight + roofWeight;
  };

  const getLoadCombinations = (buildingCode: string) => {
    // Return applicable load combinations based on building code
    return [...LOAD_COMBINATIONS_IBC.strength, ...LOAD_COMBINATIONS_IBC.serviceability];
  };

  const calculateLoadSummary = (loads: LoadResult[], combinations: any[]) => {
    const deadLoads = loads.filter(l => l.loadType === 'dead');
    const liveLoads = loads.filter(l => l.loadType === 'live');
    const windLoads = loads.filter(l => l.loadType === 'wind');
    const seismicLoads = loads.filter(l => l.loadType === 'seismic');
    
    return {
      totalDeadLoad: deadLoads.reduce((sum, load) => sum + load.magnitude, 0),
      totalLiveLoad: liveLoads.reduce((sum, load) => sum + load.magnitude, 0),
      maxWindLoad: Math.max(...windLoads.map(l => l.magnitude), 0),
      maxSeismicLoad: Math.max(...seismicLoads.map(l => l.magnitude), 0),
      governingCombination: "1.2D + 1.6L", // Simplified - would need full analysis
      maxCombinedLoad: 0 // Would calculate based on combinations
    };
  };

  const checkCodeCompliance = (params: LoadCalculationParameters, loads: LoadResult[]) => {
    const warnings: string[] = [];
    const references: string[] = [];
    
    // Check minimum live loads
    const liveLoads = loads.filter(l => l.loadType === 'live');
    const minLiveLoad = LIVE_LOADS_IBC[params.occupancyType]?.dwelling_units || 40;
    
    liveLoads.forEach(load => {
      const loadPsf = load.magnitude / 47.88; // Convert back to psf
      if (loadPsf < minLiveLoad) {
        warnings.push(`Live load ${loadPsf.toFixed(1)} psf is below minimum ${minLiveLoad} psf for ${params.occupancyType}`);
      }
    });
    
    references.push('IBC Table 1607.1');
    references.push('ASCE 7-16');
    
    return {
      isCompliant: warnings.length === 0,
      warnings,
      references
    };
  };

  const saveCalculationMutation = useMutation({
    mutationFn: async (result: LoadCalculationResult) => {
      const { data, error } = await supabase
        .from('load_calculations')
        .insert({
          user_id: user?.id,
          parameters: result.parameters,
          results: result,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['load-calculations'] });
      toast.success('Load calculation saved successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to save calculation: ${error.message}`);
    },
  });

  return {
    calculateLoads,
    saveCalculation: saveCalculationMutation.mutateAsync,
    calculating,
    saving: saveCalculationMutation.isPending,
  };
};
