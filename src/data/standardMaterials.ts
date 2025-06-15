
import { ComprehensiveMaterial } from '@/types/materials';

// Standard structural steel materials
export const STANDARD_STEEL_MATERIALS: Omit<ComprehensiveMaterial, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'A992 Grade 50',
    category: 'steel',
    subCategory: 'hot-rolled',
    description: 'High-strength low-alloy structural steel for wide-flange shapes',
    commonUses: ['Beams', 'Columns', 'Bracing'],
    structuralProperties: {
      elasticModulus: { name: 'Elastic Modulus', value: 200, unit: 'GPa', source: 'AISC' },
      shearModulus: { name: 'Shear Modulus', value: 80, unit: 'GPa', source: 'AISC' },
      poissonRatio: { name: 'Poisson Ratio', value: 0.3, unit: '', source: 'AISC' },
      density: { name: 'Density', value: 7850, unit: 'kg/m³', source: 'AISC' },
      yieldStrength: { name: 'Yield Strength', value: 345, unit: 'MPa', source: 'ASTM A992' },
      ultimateStrength: { name: 'Ultimate Strength', value: 450, unit: 'MPa', source: 'ASTM A992' },
      thermalExpansion: { name: 'Thermal Expansion', value: 11.7e-6, unit: '1/°C', source: 'AISC' },
    },
    designValues: {
      allowableStress: { name: 'Allowable Stress', value: 207, unit: 'MPa', source: 'AISC 360' },
      reductionFactors: { flexure: 0.9, compression: 0.9, tension: 0.9, shear: 0.9 },
    },
    standards: [
      { id: 'astm-a992', name: 'ASTM A992', organization: 'ASTM', specification: 'A992/A992M', year: 2020 },
      { id: 'aisc-360', name: 'AISC 360', organization: 'AISC', specification: '360-16', year: 2016 }
    ],
    costPerUnit: 1200,
    availability: 'common'
  },
  {
    name: 'A36',
    category: 'steel',
    subCategory: 'hot-rolled',
    description: 'Carbon structural steel for general construction',
    commonUses: ['Plates', 'Bars', 'Angles', 'Channels'],
    structuralProperties: {
      elasticModulus: { name: 'Elastic Modulus', value: 200, unit: 'GPa', source: 'AISC' },
      shearModulus: { name: 'Shear Modulus', value: 80, unit: 'GPa', source: 'AISC' },
      poissonRatio: { name: 'Poisson Ratio', value: 0.3, unit: '', source: 'AISC' },
      density: { name: 'Density', value: 7850, unit: 'kg/m³', source: 'AISC' },
      yieldStrength: { name: 'Yield Strength', value: 250, unit: 'MPa', source: 'ASTM A36' },
      ultimateStrength: { name: 'Ultimate Strength', value: 400, unit: 'MPa', source: 'ASTM A36' },
      thermalExpansion: { name: 'Thermal Expansion', value: 11.7e-6, unit: '1/°C', source: 'AISC' },
    },
    designValues: {
      allowableStress: { name: 'Allowable Stress', value: 150, unit: 'MPa', source: 'AISC 360' },
      reductionFactors: { flexure: 0.9, compression: 0.9, tension: 0.9, shear: 0.9 },
    },
    standards: [
      { id: 'astm-a36', name: 'ASTM A36', organization: 'ASTM', specification: 'A36/A36M', year: 2019 }
    ],
    costPerUnit: 800,
    availability: 'common'
  }
];

// Standard concrete materials
export const STANDARD_CONCRETE_MATERIALS: Omit<ComprehensiveMaterial, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Normal Weight Concrete 4000 psi',
    category: 'concrete',
    subCategory: 'normal-weight',
    description: '4000 psi compressive strength normal weight concrete',
    commonUses: ['Slabs', 'Footings', 'Walls', 'Beams'],
    structuralProperties: {
      elasticModulus: { name: 'Elastic Modulus', value: 26.7, unit: 'GPa', source: 'ACI 318' },
      poissonRatio: { name: 'Poisson Ratio', value: 0.2, unit: '', source: 'ACI 318' },
      density: { name: 'Density', value: 2400, unit: 'kg/m³', source: 'ACI 318' },
      compressiveStrength: { name: 'Compressive Strength', value: 27.6, unit: 'MPa', source: 'ACI 318' },
      tensileStrength: { name: 'Tensile Strength', value: 3.0, unit: 'MPa', source: 'ACI 318' },
      thermalExpansion: { name: 'Thermal Expansion', value: 10e-6, unit: '1/°C', source: 'ACI 318' },
    },
    designValues: {
      reductionFactors: { 
        compression: 0.65, 
        tension: 0.65, 
        shear: 0.75, 
        flexure: 0.9,
        torsion: 0.75 
      },
    },
    standards: [
      { id: 'aci-318', name: 'ACI 318', organization: 'ACI', specification: '318-19', year: 2019 }
    ],
    costPerUnit: 150,
    availability: 'common'
  },
  {
    name: 'High Strength Concrete 8000 psi',
    category: 'concrete',
    subCategory: 'high-strength',
    description: '8000 psi compressive strength high performance concrete',
    commonUses: ['High-rise columns', 'Prestressed beams', 'Special structures'],
    structuralProperties: {
      elasticModulus: { name: 'Elastic Modulus', value: 37.8, unit: 'GPa', source: 'ACI 318' },
      poissonRatio: { name: 'Poisson Ratio', value: 0.2, unit: '', source: 'ACI 318' },
      density: { name: 'Density', value: 2400, unit: 'kg/m³', source: 'ACI 318' },
      compressiveStrength: { name: 'Compressive Strength', value: 55.2, unit: 'MPa', source: 'ACI 318' },
      tensileStrength: { name: 'Tensile Strength', value: 4.2, unit: 'MPa', source: 'ACI 318' },
      thermalExpansion: { name: 'Thermal Expansion', value: 10e-6, unit: '1/°C', source: 'ACI 318' },
    },
    designValues: {
      reductionFactors: { 
        compression: 0.65, 
        tension: 0.65, 
        shear: 0.75, 
        flexure: 0.9,
        torsion: 0.75 
      },
    },
    standards: [
      { id: 'aci-318', name: 'ACI 318', organization: 'ACI', specification: '318-19', year: 2019 }
    ],
    costPerUnit: 250,
    availability: 'specialty'
  }
];

// Standard wood materials
export const STANDARD_WOOD_MATERIALS: Omit<ComprehensiveMaterial, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Douglas Fir-Larch No. 1',
    category: 'wood',
    subCategory: 'lumber',
    description: 'Structural lumber grade Douglas Fir-Larch',
    commonUses: ['Beams', 'Joists', 'Studs', 'Posts'],
    structuralProperties: {
      elasticModulus: { name: 'Elastic Modulus', value: 13.1, unit: 'GPa', source: 'NDS' },
      shearModulus: { name: 'Shear Modulus', value: 0.82, unit: 'GPa', source: 'NDS' },
      poissonRatio: { name: 'Poisson Ratio', value: 0.3, unit: '', source: 'NDS' },
      density: { name: 'Density', value: 550, unit: 'kg/m³', source: 'NDS' },
      tensileStrength: { name: 'Tensile Strength', value: 10.3, unit: 'MPa', source: 'NDS' },
      compressiveStrength: { name: 'Compressive Strength', value: 7.2, unit: 'MPa', source: 'NDS' },
      shearStrength: { name: 'Shear Strength', value: 1.0, unit: 'MPa', source: 'NDS' },
    },
    designValues: {
      modificationFactors: {
        load_duration: 1.0,
        moisture: 1.0,
        temperature: 1.0,
        size: 1.0,
        stability: 1.0
      }
    },
    standards: [
      { id: 'nds-2018', name: 'NDS', organization: 'AWC', specification: 'NDS-2018', year: 2018 }
    ],
    costPerUnit: 600,
    availability: 'common',
    sustainability: {
      recycledContent: 0,
      recyclable: true,
      carbonFootprint: -500 // negative for carbon sequestration
    }
  }
];

export const ALL_STANDARD_MATERIALS = [
  ...STANDARD_STEEL_MATERIALS,
  ...STANDARD_CONCRETE_MATERIALS,
  ...STANDARD_WOOD_MATERIALS
];
