
import type { BIMElement, Material } from '@/types/materials';
import type { CostEstimation, CostLineItem, QuantityTakeoff } from '@/types/cost-estimation';
import type { LoadCalculationParameters, LoadCalculationResult } from '@/types/loads';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100 quality score
}

export interface ValidationError {
  id: string;
  type: 'critical' | 'error' | 'warning';
  category: 'geometry' | 'material' | 'cost' | 'structural' | 'compliance';
  message: string;
  location?: string;
  suggestion?: string;
  data?: any;
}

export interface ValidationWarning {
  id: string;
  category: 'optimization' | 'accuracy' | 'performance';
  message: string;
  impact: 'low' | 'medium' | 'high';
  suggestion: string;
}

export class ModelValidator {
  static validateBIMElement(element: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required field validation
    if (!element.name || element.name.trim() === '') {
      errors.push({
        id: 'missing-name',
        type: 'error',
        category: 'geometry',
        message: 'Element name is required',
        suggestion: 'Provide a descriptive name for the element'
      });
    }

    if (!element.element_type) {
      errors.push({
        id: 'missing-type',
        type: 'critical',
        category: 'geometry',
        message: 'Element type is required',
        suggestion: 'Specify the element type (wall, beam, column, etc.)'
      });
    }

    // Geometry validation
    if (element.geometry) {
      const geoValidation = this.validateGeometry(element.geometry, element.element_type);
      errors.push(...geoValidation.errors);
      warnings.push(...geoValidation.warnings);
    } else {
      errors.push({
        id: 'missing-geometry',
        type: 'critical',
        category: 'geometry',
        message: 'Element geometry is required',
        suggestion: 'Define the geometric properties for this element'
      });
    }

    // Material validation
    if (element.material_id && element.materials) {
      const matValidation = this.validateMaterial(element.materials, element.element_type);
      errors.push(...matValidation.errors);
      warnings.push(...matValidation.warnings);
    } else if (!element.material_id) {
      warnings.push({
        id: 'missing-material',
        category: 'accuracy',
        message: 'No material assigned to element',
        impact: 'medium',
        suggestion: 'Assign appropriate material for accurate analysis'
      });
    }

    const score = this.calculateValidationScore(errors, warnings);

    return {
      isValid: errors.filter(e => e.type === 'critical' || e.type === 'error').length === 0,
      errors,
      warnings,
      score
    };
  }

  static validateGeometry(geometry: any, elementType: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    switch (elementType) {
      case 'wall':
        if (!geometry.length || geometry.length <= 0) {
          errors.push({
            id: 'invalid-wall-length',
            type: 'error',
            category: 'geometry',
            message: 'Wall length must be greater than 0',
            suggestion: 'Provide a valid positive length value'
          });
        }
        if (!geometry.height || geometry.height <= 0) {
          errors.push({
            id: 'invalid-wall-height',
            type: 'error',
            category: 'geometry',
            message: 'Wall height must be greater than 0',
            suggestion: 'Provide a valid positive height value'
          });
        }
        if (!geometry.thickness || geometry.thickness <= 0) {
          errors.push({
            id: 'invalid-wall-thickness',
            type: 'error',
            category: 'geometry',
            message: 'Wall thickness must be greater than 0',
            suggestion: 'Provide a valid positive thickness value'
          });
        }
        if (geometry.thickness && geometry.thickness > geometry.length) {
          warnings.push({
            id: 'unusual-wall-proportions',
            category: 'accuracy',
            message: 'Wall thickness is greater than length',
            impact: 'medium',
            suggestion: 'Verify wall dimensions are correct'
          });
        }
        break;

      case 'beam':
        if (!geometry.length || geometry.length <= 0) {
          errors.push({
            id: 'invalid-beam-length',
            type: 'error',
            category: 'geometry',
            message: 'Beam length must be greater than 0',
            suggestion: 'Provide a valid positive length value'
          });
        }
        if (!geometry.cross_section_area || geometry.cross_section_area <= 0) {
          errors.push({
            id: 'invalid-beam-area',
            type: 'error',
            category: 'geometry',
            message: 'Beam cross-section area must be greater than 0',
            suggestion: 'Provide a valid positive cross-section area'
          });
        }
        break;

      case 'column':
        if (!geometry.height || geometry.height <= 0) {
          errors.push({
            id: 'invalid-column-height',
            type: 'error',
            category: 'geometry',
            message: 'Column height must be greater than 0',
            suggestion: 'Provide a valid positive height value'
          });
        }
        if (!geometry.cross_section_area || geometry.cross_section_area <= 0) {
          errors.push({
            id: 'invalid-column-area',
            type: 'error',
            category: 'geometry',
            message: 'Column cross-section area must be greater than 0',
            suggestion: 'Provide a valid positive cross-section area'
          });
        }
        break;

      case 'slab':
        if (!geometry.width || geometry.width <= 0) {
          errors.push({
            id: 'invalid-slab-width',
            type: 'error',
            category: 'geometry',
            message: 'Slab width must be greater than 0',
            suggestion: 'Provide a valid positive width value'
          });
        }
        if (!geometry.length || geometry.length <= 0) {
          errors.push({
            id: 'invalid-slab-length',
            type: 'error',
            category: 'geometry',
            message: 'Slab length must be greater than 0',
            suggestion: 'Provide a valid positive length value'
          });
        }
        if (!geometry.thickness || geometry.thickness <= 0) {
          errors.push({
            id: 'invalid-slab-thickness',
            type: 'error',
            category: 'geometry',
            message: 'Slab thickness must be greater than 0',
            suggestion: 'Provide a valid positive thickness value'
          });
        }
        break;
    }

    const score = this.calculateValidationScore(errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  static validateMaterial(material: any, elementType: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!material.name || material.name.trim() === '') {
      errors.push({
        id: 'missing-material-name',
        type: 'error',
        category: 'material',
        message: 'Material name is required',
        suggestion: 'Provide a material name'
      });
    }

    if (!material.material_type) {
      errors.push({
        id: 'missing-material-type',
        type: 'error',
        category: 'material',
        message: 'Material type is required',
        suggestion: 'Specify the material type (concrete, steel, wood, etc.)'
      });
    }

    // Check material compatibility with element type
    const compatibilityCheck = this.checkMaterialCompatibility(material.material_type, elementType);
    if (!compatibilityCheck.compatible) {
      warnings.push({
        id: 'material-compatibility',
        category: 'accuracy',
        message: compatibilityCheck.message,
        impact: 'medium',
        suggestion: compatibilityCheck.suggestion
      });
    }

    // Validate material properties
    if (material.properties) {
      const propValidation = this.validateMaterialProperties(material.properties, material.material_type);
      errors.push(...propValidation.errors);
      warnings.push(...propValidation.warnings);
    }

    const score = this.calculateValidationScore(errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  static validateMaterialProperties(properties: any, materialType: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (materialType === 'concrete') {
      if (!properties.compressive_strength || properties.compressive_strength <= 0) {
        errors.push({
          id: 'invalid-concrete-strength',
          type: 'error',
          category: 'material',
          message: 'Concrete compressive strength must be greater than 0',
          suggestion: 'Provide valid compressive strength in PSI or MPa'
        });
      }
      if (properties.compressive_strength && properties.compressive_strength < 2000) {
        warnings.push({
          id: 'low-concrete-strength',
          category: 'accuracy',
          message: 'Concrete strength appears to be very low',
          impact: 'medium',
          suggestion: 'Verify concrete strength is in correct units (PSI)'
        });
      }
    }

    if (materialType === 'steel') {
      if (!properties.yield_strength || properties.yield_strength <= 0) {
        errors.push({
          id: 'invalid-steel-yield',
          type: 'error',
          category: 'material',
          message: 'Steel yield strength must be greater than 0',
          suggestion: 'Provide valid yield strength'
        });
      }
    }

    // Validate density
    if (properties.density && properties.density <= 0) {
      errors.push({
        id: 'invalid-density',
        type: 'error',
        category: 'material',
        message: 'Material density must be greater than 0',
        suggestion: 'Provide valid material density'
      });
    }

    const score = this.calculateValidationScore(errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  static checkMaterialCompatibility(materialType: string, elementType: string): { compatible: boolean; message: string; suggestion: string } {
    const compatibilityMatrix: Record<string, string[]> = {
      concrete: ['wall', 'beam', 'column', 'slab', 'foundation'],
      steel: ['beam', 'column', 'connection'],
      wood: ['beam', 'wall', 'roof'],
      masonry: ['wall', 'foundation'],
      composite: ['beam', 'slab', 'wall']
    };

    const compatibleElements = compatibilityMatrix[materialType] || [];
    const isCompatible = compatibleElements.includes(elementType);

    return {
      compatible: isCompatible,
      message: isCompatible 
        ? 'Material is compatible with element type'
        : `${materialType} is not typically used for ${elementType} elements`,
      suggestion: isCompatible 
        ? 'Material selection is appropriate'
        : `Consider using materials typically used for ${elementType}: ${compatibilityMatrix[elementType] || 'consult structural engineer'}`
    };
  }

  static calculateValidationScore(errors: ValidationError[], warnings: ValidationWarning[]): number {
    let score = 100;
    
    errors.forEach(error => {
      switch (error.type) {
        case 'critical':
          score -= 25;
          break;
        case 'error':
          score -= 15;
          break;
        case 'warning':
          score -= 5;
          break;
      }
    });

    warnings.forEach(warning => {
      switch (warning.impact) {
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    });

    return Math.max(0, score);
  }
}
