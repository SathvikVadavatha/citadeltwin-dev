
import { ComprehensiveMaterial } from '@/types/materials';

// Enhanced steel materials with comprehensive standards
const ENHANCED_STEEL_MATERIALS: Omit<ComprehensiveMaterial, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'ASTM A992 Grade 50 Structural Steel',
    category: 'steel',
    subCategory: 'hot-rolled',
    structuralProperties: {
      elasticModulus: { name: 'Elastic Modulus', value: 200000, unit: 'MPa', source: 'AISC' },
      poissonRatio: { name: 'Poisson Ratio', value: 0.30, unit: 'dimensionless', source: 'AISC' },
      density: { name: 'Density', value: 7850, unit: 'kg/m³', source: 'AISC' },
      yieldStrength: { name: 'Yield Strength', value: 345, unit: 'MPa', source: 'ASTM A992' },
      ultimateStrength: { name: 'Ultimate Strength', value: 450, unit: 'MPa', source: 'ASTM A992' },
      thermalExpansion: { name: 'Thermal Expansion', value: 11.7e-6, unit: '1/°C', source: 'AISC' }
    },
    designValues: {
      allowableStress: { name: 'Allowable Stress', value: 230, unit: 'MPa', source: 'AISC 360' },
      reductionFactors: { 'φ_tension': 0.90, 'φ_compression': 0.90, 'φ_flexure': 0.90 },
      safetyFactors: { 'γ_dead': 1.2, 'γ_live': 1.6, 'γ_wind': 1.0 }
    },
    standards: [
      { id: 'astm-a992', name: 'ASTM A992', organization: 'ASTM', specification: 'A992/A992M-11', year: 2011 },
      { id: 'aisc-360', name: 'AISC 360', organization: 'AISC', specification: 'AISC 360-16', year: 2016 }
    ],
    description: 'High-strength, low-alloy structural steel for building construction',
    commonUses: ['Wide flange beams', 'Columns', 'Structural framing', 'High-rise construction'],
    limitations: ['Not suitable for high-temperature applications', 'Requires corrosion protection'],
    costPerUnit: 1200,
    availability: 'common',
    sustainability: {
      recycledContent: 90,
      recyclable: true,
      carbonFootprint: 1850
    }
  },
  {
    name: 'ASTM A572 Grade 65 High-Strength Steel',
    category: 'steel',
    subCategory: 'high-strength',
    structuralProperties: {
      elasticModulus: { name: 'Elastic Modulus', value: 200000, unit: 'MPa', source: 'AISC' },
      poissonRatio: { name: 'Poisson Ratio', value: 0.30, unit: 'dimensionless', source: 'AISC' },
      density: { name: 'Density', value: 7850, unit: 'kg/m³', source: 'AISC' },
      yieldStrength: { name: 'Yield Strength', value: 450, unit: 'MPa', source: 'ASTM A572' },
      ultimateStrength: { name: 'Ultimate Strength', value: 550, unit: 'MPa', source: 'ASTM A572' },
      thermalExpansion: { name: 'Thermal Expansion', value: 11.7e-6, unit: '1/°C', source: 'AISC' }
    },
    designValues: {
      allowableStress: { name: 'Allowable Stress', value: 300, unit: 'MPa', source: 'AISC 360' },
      reductionFactors: { 'φ_tension': 0.90, 'φ_compression': 0.90, 'φ_flexure': 0.90 }
    },
    standards: [
      { id: 'astm-a572', name: 'ASTM A572', organization: 'ASTM', specification: 'A572/A572M-18', year: 2018 }
    ],
    description: 'High-strength, low-alloy steel for demanding structural applications',
    commonUses: ['Heavy construction', 'Bridge construction', 'High-load applications'],
    costPerUnit: 1350,
    availability: 'common'
  }
];

// Enhanced concrete materials
const ENHANCED_CONCRETE_MATERIALS: Omit<ComprehensiveMaterial, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Normal Weight Concrete f\'c = 4000 psi',
    category: 'concrete',
    subCategory: 'normal-weight',
    structuralProperties: {
      elasticModulus: { name: 'Elastic Modulus', value: 24855, unit: 'MPa', source: 'ACI 318', temperature: 20 },
      poissonRatio: { name: 'Poisson Ratio', value: 0.20, unit: 'dimensionless', source: 'ACI 318' },
      density: { name: 'Density', value: 2400, unit: 'kg/m³', source: 'ACI 318' },
      compressiveStrength: { name: 'Compressive Strength', value: 27.6, unit: 'MPa', source: 'ACI 318' },
      tensileStrength: { name: 'Tensile Strength', value: 2.8, unit: 'MPa', source: 'ACI 318' },
      thermalExpansion: { name: 'Thermal Expansion', value: 10e-6, unit: '1/°C', source: 'ACI 318' }
    },
    designValues: {
      reductionFactors: { 'φ_compression': 0.65, 'φ_tension': 0.65, 'φ_shear': 0.75 },
      safetyFactors: { 'γ_concrete': 1.4, 'γ_steel': 1.15 }
    },
    standards: [
      { id: 'aci-318', name: 'ACI 318', organization: 'ACI', specification: 'ACI 318-19', year: 2019 },
      { id: 'astm-c150', name: 'ASTM C150', organization: 'ASTM', specification: 'C150/C150M-20', year: 2020 }
    ],
    description: 'Standard concrete mix for general construction applications',
    commonUses: ['Building foundations', 'Slabs', 'Walls', 'General construction'],
    costPerUnit: 120,
    availability: 'common',
    sustainability: {
      recycledContent: 20,
      recyclable: true,
      carbonFootprint: 400
    }
  },
  {
    name: 'High-Strength Concrete f\'c = 8000 psi',
    category: 'concrete',
    subCategory: 'high-strength',
    structuralProperties: {
      elasticModulus: { name: 'Elastic Modulus', value: 35000, unit: 'MPa', source: 'ACI 318' },
      poissonRatio: { name: 'Poisson Ratio', value: 0.20, unit: 'dimensionless', source: 'ACI 318' },
      density: { name: 'Density', value: 2400, unit: 'kg/m³', source: 'ACI 318' },
      compressiveStrength: { name: 'Compressive Strength', value: 55.2, unit: 'MPa', source: 'ACI 318' },
      tensileStrength: { name: 'Tensile Strength', value: 4.0, unit: 'MPa', source: 'ACI 318' }
    },
    designValues: {
      reductionFactors: { 'φ_compression': 0.65, 'φ_tension': 0.65, 'φ_shear': 0.75 }
    },
    standards: [
      { id: 'aci-318', name: 'ACI 318', organization: 'ACI', specification: 'ACI 318-19', year: 2019 }
    ],
    description: 'High-performance concrete for demanding structural applications',
    commonUses: ['High-rise buildings', 'Precast elements', 'Prestressed construction'],
    costPerUnit: 180,
    availability: 'specialty'
  }
];

// Enhanced wood materials
const ENHANCED_WOOD_MATERIALS: Omit<ComprehensiveMaterial, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Douglas Fir-Larch No. 1 Grade',
    category: 'wood',
    subCategory: 'lumber',
    structuralProperties: {
      elasticModulus: { name: 'Elastic Modulus', value: 13100, unit: 'MPa', source: 'NDS 2018' },
      poissonRatio: { name: 'Poisson Ratio', value: 0.30, unit: 'dimensionless', source: 'NDS' },
      density: { name: 'Density', value: 550, unit: 'kg/m³', source: 'NDS' },
      yieldStrength: { name: 'Bending Strength', value: 12.4, unit: 'MPa', source: 'NDS 2018' },
      compressiveStrength: { name: 'Compression Parallel', value: 7.6, unit: 'MPa', source: 'NDS 2018' },
      thermalExpansion: { name: 'Thermal Expansion', value: 3.5e-6, unit: '1/°C', source: 'NDS' }
    },
    designValues: {
      modificationFactors: { 'C_D': 1.0, 'C_M': 1.0, 'C_t': 1.0, 'C_L': 1.0, 'C_F': 1.0 },
      safetyFactors: { 'K_F': 2.1, 'φ': 0.85 }
    },
    standards: [
      { id: 'nds-2018', name: 'NDS 2018', organization: 'AWC', specification: 'ANSI/AWC NDS-2018', year: 2018 },
      { id: 'astm-d245', name: 'ASTM D245', organization: 'ASTM', specification: 'D245-06', year: 2019 }
    ],
    description: 'High-quality structural lumber for framing and construction',
    commonUses: ['Structural framing', 'Beams', 'Joists', 'Residential construction'],
    costPerUnit: 800,
    availability: 'common',
    sustainability: {
      recycledContent: 0,
      recyclable: true,
      carbonFootprint: -950 // Carbon negative due to sequestration
    }
  },
  {
    name: 'Glued Laminated Timber (Glulam) 24F-V4',
    category: 'wood',
    subCategory: 'glulam',
    structuralProperties: {
      elasticModulus: { name: 'Elastic Modulus', value: 13800, unit: 'MPa', source: 'ANSI 117' },
      density: { name: 'Density', value: 550, unit: 'kg/m³', source: 'ANSI 117' },
      yieldStrength: { name: 'Bending Strength', value: 16.6, unit: 'MPa', source: 'ANSI 117' },
      compressiveStrength: { name: 'Compression Parallel', value: 9.7, unit: 'MPa', source: 'ANSI 117' }
    },
    standards: [
      { id: 'ansi-117', name: 'ANSI 117', organization: 'APA', specification: 'ANSI A190.1-2017', year: 2017 }
    ],
    description: 'Engineered wood product for large span applications',
    commonUses: ['Long span beams', 'Arches', 'Commercial construction'],
    costPerUnit: 1200,
    availability: 'specialty'
  }
];

// Enhanced aluminum materials
const ENHANCED_ALUMINUM_MATERIALS: Omit<ComprehensiveMaterial, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Aluminum Alloy 6061-T6',
    category: 'aluminum',
    subCategory: 'structural',
    structuralProperties: {
      elasticModulus: { name: 'Elastic Modulus', value: 68900, unit: 'MPa', source: 'AA' },
      poissonRatio: { name: 'Poisson Ratio', value: 0.33, unit: 'dimensionless', source: 'AA' },
      density: { name: 'Density', value: 2700, unit: 'kg/m³', source: 'AA' },
      yieldStrength: { name: 'Yield Strength', value: 276, unit: 'MPa', source: 'ASTM B211' },
      ultimateStrength: { name: 'Ultimate Strength', value: 310, unit: 'MPa', source: 'ASTM B211' },
      thermalExpansion: { name: 'Thermal Expansion', value: 23.6e-6, unit: '1/°C', source: 'AA' }
    },
    designValues: {
      allowableStress: { name: 'Allowable Stress', value: 165, unit: 'MPa', source: 'ADM1' },
      reductionFactors: { 'φ': 0.85 }
    },
    standards: [
      { id: 'astm-b211', name: 'ASTM B211', organization: 'ASTM', specification: 'B211-19', year: 2019 },
      { id: 'adm1', name: 'ADM1', organization: 'AA', specification: 'ADM1-15', year: 2015 }
    ],
    description: 'Heat-treatable aluminum alloy for structural applications',
    commonUses: ['Structural framing', 'Curtain walls', 'Marine applications'],
    costPerUnit: 3200,
    availability: 'common',
    sustainability: {
      recycledContent: 85,
      recyclable: true,
      carbonFootprint: 11500
    }
  }
];

// Export all enhanced materials
export const ALL_ENHANCED_STANDARD_MATERIALS = [
  ...ENHANCED_STEEL_MATERIALS,
  ...ENHANCED_CONCRETE_MATERIALS,
  ...ENHANCED_WOOD_MATERIALS,
  ...ENHANCED_ALUMINUM_MATERIALS
];

// Export by category for easier access
export const ENHANCED_MATERIALS_BY_CATEGORY = {
  steel: ENHANCED_STEEL_MATERIALS,
  concrete: ENHANCED_CONCRETE_MATERIALS,
  wood: ENHANCED_WOOD_MATERIALS,
  aluminum: ENHANCED_ALUMINUM_MATERIALS
};
