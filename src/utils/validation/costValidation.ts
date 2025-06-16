
import type { CostEstimation, CostLineItem, QuantityTakeoff } from '@/types/cost-estimation';
import { ValidationResult, ValidationError, ValidationWarning } from './modelValidation';

export class CostValidator {
  static validateCostEstimation(estimation: CostEstimation, lineItems: CostLineItem[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic estimation validation
    if (!estimation.name || estimation.name.trim() === '') {
      errors.push({
        id: 'missing-estimation-name',
        type: 'error',
        category: 'cost',
        message: 'Cost estimation name is required',
        suggestion: 'Provide a descriptive name for the cost estimation'
      });
    }

    if (estimation.markup_percentage < 0 || estimation.markup_percentage > 100) {
      errors.push({
        id: 'invalid-markup',
        type: 'error',
        category: 'cost',
        message: 'Markup percentage must be between 0 and 100',
        suggestion: 'Set markup percentage to a reasonable value (typically 10-25%)'
      });
    }

    if (estimation.contingency_percentage < 0 || estimation.contingency_percentage > 50) {
      errors.push({
        id: 'invalid-contingency',
        type: 'error',
        category: 'cost',
        message: 'Contingency percentage must be between 0 and 50',
        suggestion: 'Set contingency percentage to a reasonable value (typically 5-15%)'
      });
    }

    if (estimation.labor_rate_per_hour <= 0) {
      errors.push({
        id: 'invalid-labor-rate',
        type: 'error',
        category: 'cost',
        message: 'Labor rate per hour must be greater than 0',
        suggestion: 'Set a realistic labor rate for your location'
      });
    }

    // Line items validation
    if (lineItems.length === 0) {
      warnings.push({
        id: 'no-line-items',
        category: 'accuracy',
        message: 'No line items in cost estimation',
        impact: 'high',
        suggestion: 'Add line items to create a comprehensive cost estimate'
      });
    }

    lineItems.forEach((item, index) => {
      const itemValidation = this.validateLineItem(item, index);
      errors.push(...itemValidation.errors);
      warnings.push(...itemValidation.warnings);
    });

    // Cost reasonableness checks
    const totalCost = lineItems.reduce((sum, item) => sum + item.total_cost, 0);
    const materialCost = lineItems.filter(item => item.category === 'material').reduce((sum, item) => sum + item.total_cost, 0);
    const laborCost = lineItems.filter(item => item.category === 'labor').reduce((sum, item) => sum + item.total_cost, 0);

    if (materialCost > 0 && laborCost > 0) {
      const laborToMaterialRatio = laborCost / materialCost;
      if (laborToMaterialRatio > 3) {
        warnings.push({
          id: 'high-labor-ratio',
          category: 'accuracy',
          message: 'Labor cost is unusually high compared to material cost',
          impact: 'medium',
          suggestion: 'Review labor quantities and rates for accuracy'
        });
      } else if (laborToMaterialRatio < 0.3) {
        warnings.push({
          id: 'low-labor-ratio',
          category: 'accuracy',
          message: 'Labor cost is unusually low compared to material cost',
          impact: 'medium',
          suggestion: 'Ensure all labor costs are included'
        });
      }
    }

    const score = this.calculateValidationScore(errors, warnings);

    return {
      isValid: errors.filter(e => e.type === 'critical' || e.type === 'error').length === 0,
      errors,
      warnings,
      score
    };
  }

  static validateLineItem(item: CostLineItem, index: number): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!item.item_description || item.item_description.trim() === '') {
      errors.push({
        id: `line-item-${index}-missing-description`,
        type: 'error',
        category: 'cost',
        message: `Line item ${index + 1}: Description is required`,
        suggestion: 'Provide a clear description of the work item'
      });
    }

    if (!item.category || !['material', 'labor', 'equipment'].includes(item.category)) {
      errors.push({
        id: `line-item-${index}-invalid-category`,
        type: 'error',
        category: 'cost',
        message: `Line item ${index + 1}: Invalid category`,
        suggestion: 'Category must be material, labor, or equipment'
      });
    }

    if (item.quantity <= 0) {
      errors.push({
        id: `line-item-${index}-invalid-quantity`,
        type: 'error',
        category: 'cost',
        message: `Line item ${index + 1}: Quantity must be greater than 0`,
        suggestion: 'Enter a valid positive quantity'
      });
    }

    if (item.unit_cost <= 0) {
      errors.push({
        id: `line-item-${index}-invalid-unit-cost`,
        type: 'error',
        category: 'cost',
        message: `Line item ${index + 1}: Unit cost must be greater than 0`,
        suggestion: 'Enter a valid positive unit cost'
      });
    }

    if (Math.abs(item.total_cost - (item.quantity * item.unit_cost)) > 0.01) {
      errors.push({
        id: `line-item-${index}-cost-mismatch`,
        type: 'error',
        category: 'cost',
        message: `Line item ${index + 1}: Total cost doesn't match quantity × unit cost`,
        suggestion: 'Verify the calculation: total cost should equal quantity × unit cost'
      });
    }

    if (item.waste_factor && (item.waste_factor < 0 || item.waste_factor > 1)) {
      warnings.push({
        id: `line-item-${index}-invalid-waste`,
        category: 'accuracy',
        message: `Line item ${index + 1}: Waste factor should be between 0 and 1`,
        impact: 'low',
        suggestion: 'Waste factor should be expressed as a decimal (e.g., 0.1 for 10%)'
      });
    }

    // Cost reasonableness checks
    if (item.category === 'material' && item.unit_cost > 10000) {
      warnings.push({
        id: `line-item-${index}-high-material-cost`,
        category: 'accuracy',
        message: `Line item ${index + 1}: Material unit cost seems very high`,
        impact: 'medium',
        suggestion: 'Verify the unit cost and unit of measure are correct'
      });
    }

    if (item.category === 'labor' && item.labor_hours_per_unit > 40) {
      warnings.push({
        id: `line-item-${index}-high-labor-hours`,
        category: 'accuracy',
        message: `Line item ${index + 1}: Labor hours per unit seems very high`,
        impact: 'medium',
        suggestion: 'Review the labor hours calculation for accuracy'
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

  static validateQuantityTakeoff(takeoff: QuantityTakeoff): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (takeoff.calculated_quantity <= 0) {
      errors.push({
        id: 'invalid-quantity',
        type: 'error',
        category: 'cost',
        message: 'Calculated quantity must be greater than 0',
        suggestion: 'Verify the element geometry and calculation method'
      });
    }

    if (!takeoff.unit_of_measure || takeoff.unit_of_measure.trim() === '') {
      errors.push({
        id: 'missing-unit',
        type: 'error',
        category: 'cost',
        message: 'Unit of measure is required',
        suggestion: 'Specify the appropriate unit (cy, sf, ea, etc.)'
      });
    }

    if (!takeoff.calculation_method) {
      warnings.push({
        id: 'missing-method',
        category: 'accuracy',
        message: 'Calculation method not specified',
        impact: 'low',
        suggestion: 'Document the calculation method used'
      });
    }

    // Validate against element geometry if available
    if (takeoff.bim_elements && takeoff.geometry_data) {
      const geometryValidation = this.validateTakeoffGeometry(takeoff);
      errors.push(...geometryValidation.errors);
      warnings.push(...geometryValidation.warnings);
    }

    const score = this.calculateValidationScore(errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  static validateTakeoffGeometry(takeoff: QuantityTakeoff): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!takeoff.bim_elements || !takeoff.geometry_data) {
      return { isValid: true, errors, warnings, score: 100 };
    }

    const elementType = takeoff.bim_elements.element_type;
    const geometry = takeoff.geometry_data;

    // Recalculate quantity and compare
    let expectedQuantity = 0;
    
    switch (elementType) {
      case 'wall':
        if (geometry.length && geometry.height && geometry.thickness) {
          expectedQuantity = geometry.length * geometry.height * geometry.thickness;
        }
        break;
      case 'slab':
        if (geometry.width && geometry.length && geometry.thickness) {
          expectedQuantity = geometry.width * geometry.length * geometry.thickness;
        }
        break;
      case 'beam':
        if (geometry.length && geometry.cross_section_area) {
          expectedQuantity = geometry.length * geometry.cross_section_area;
        }
        break;
      case 'column':
        if (geometry.height && geometry.cross_section_area) {
          expectedQuantity = geometry.height * geometry.cross_section_area;
        }
        break;
    }

    if (expectedQuantity > 0) {
      const difference = Math.abs(takeoff.calculated_quantity - expectedQuantity);
      const percentDifference = (difference / expectedQuantity) * 100;

      if (percentDifference > 10) {
        warnings.push({
          id: 'quantity-mismatch',
          category: 'accuracy',
          message: `Calculated quantity differs from expected by ${percentDifference.toFixed(1)}%`,
          impact: percentDifference > 25 ? 'high' : 'medium',
          suggestion: 'Review the calculation method and element geometry'
        });
      }
    }

    const score = this.calculateValidationScore(errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score
    };
  }

  private static calculateValidationScore(errors: ValidationError[], warnings: ValidationWarning[]): number {
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
