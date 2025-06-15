
export interface MaterialProperty {
  name: string;
  value: number;
  unit: string;
  source?: string; // e.g., "AISC", "ACI", "NDS"
  temperature?: number; // temperature dependency
}

export interface StructuralProperties {
  // Mechanical Properties
  elasticModulus: MaterialProperty; // E (GPa)
  shearModulus?: MaterialProperty; // G (GPa) - optional as it can be calculated
  poissonRatio: MaterialProperty; // ν (dimensionless)
  density: MaterialProperty; // ρ (kg/m³)
  
  // Strength Properties
  yieldStrength?: MaterialProperty; // fy (MPa)
  ultimateStrength?: MaterialProperty; // fu (MPa)
  compressiveStrength?: MaterialProperty; // fc (MPa)
  tensileStrength?: MaterialProperty; // ft (MPa)
  shearStrength?: MaterialProperty; // fv (MPa)
  
  // Durability Properties
  thermalExpansion?: MaterialProperty; // α (1/°C)
  thermalConductivity?: MaterialProperty; // k (W/m·K)
  moistureExpansion?: MaterialProperty; // (dimensionless)
  
  // Fatigue Properties
  fatigueLimit?: MaterialProperty; // (MPa)
  enduranceLimit?: MaterialProperty; // (MPa)
}

export interface DesignValues {
  // Code-specified design values
  allowableStress?: MaterialProperty;
  reductionFactors?: Record<string, number>; // φ factors
  safetyFactors?: Record<string, number>; // γ factors
  modificationFactors?: Record<string, number>; // adjustment factors
}

export interface MaterialStandard {
  id: string;
  name: string;
  organization: string; // ASTM, AISC, ACI, etc.
  specification: string; // specific standard number
  grade?: string;
  year?: number;
}

export interface ComprehensiveMaterial {
  id: string;
  name: string;
  category: 'steel' | 'concrete' | 'wood' | 'aluminum' | 'composite' | 'masonry';
  subCategory?: string; // e.g., 'hot-rolled', 'cold-formed', 'prestressed'
  
  // Properties
  structuralProperties: StructuralProperties;
  designValues: DesignValues;
  
  // Standards & Certifications
  standards: MaterialStandard[];
  
  // Metadata
  description?: string;
  commonUses: string[];
  limitations?: string[];
  
  // Economic data
  costPerUnit?: number;
  availability?: 'common' | 'specialty' | 'rare';
  
  // Environmental
  sustainability?: {
    recycledContent?: number; // percentage
    recyclable?: boolean;
    carbonFootprint?: number; // kg CO2 equivalent
  };
  
  createdAt: string;
  updatedAt: string;
}

// Standard material categories for filtering and organization
export const MATERIAL_CATEGORIES = {
  steel: {
    name: 'Steel',
    subCategories: [
      'hot-rolled',
      'cold-formed',
      'stainless',
      'weathering',
      'high-strength'
    ]
  },
  concrete: {
    name: 'Concrete',
    subCategories: [
      'normal-weight',
      'lightweight',
      'high-strength',
      'prestressed',
      'precast'
    ]
  },
  wood: {
    name: 'Wood',
    subCategories: [
      'lumber',
      'engineered',
      'glulam',
      'lvl',
      'plywood'
    ]
  },
  aluminum: {
    name: 'Aluminum',
    subCategories: [
      'structural',
      'architectural',
      'marine'
    ]
  },
  composite: {
    name: 'Composite',
    subCategories: [
      'frp',
      'carbon-fiber',
      'glass-fiber'
    ]
  },
  masonry: {
    name: 'Masonry',
    subCategories: [
      'brick',
      'block',
      'stone'
    ]
  }
} as const;

export type MaterialCategory = keyof typeof MATERIAL_CATEGORIES;
export type MaterialSubCategory = typeof MATERIAL_CATEGORIES[MaterialCategory]['subCategories'][number];
