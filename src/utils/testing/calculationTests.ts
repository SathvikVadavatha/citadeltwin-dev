
import { calculateQuantityFromElement, getUnitOfMeasureForElement } from '@/hooks/quantity-takeoff/useQuantityCalculations';
import { calculateCostSummary } from '@/utils/cost-estimation/costCalculations';

export interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  expected?: any;
  actual?: any;
  tolerance?: number;
}

export interface TestSuite {
  suiteName: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  score: number;
}

export class CalculationTester {
  static runQuantityCalculationTests(): TestSuite {
    const tests: TestResult[] = [];

    // Test wall quantity calculation
    tests.push(this.testWallQuantity());
    tests.push(this.testBeamQuantity());
    tests.push(this.testColumnQuantity());
    tests.push(this.testSlabQuantity());
    tests.push(this.testUnitOfMeasure());
    tests.push(this.testZeroValues());
    tests.push(this.testNegativeValues());

    const passed = tests.filter(t => t.passed).length;
    const failed = tests.length - passed;
    const score = (passed / tests.length) * 100;

    return {
      suiteName: 'Quantity Calculations',
      tests,
      passed,
      failed,
      score
    };
  }

  static testWallQuantity(): TestResult {
    const element = {
      element_type: 'wall',
      geometry: {
        length: 10,
        height: 3,
        thickness: 0.25
      }
    };

    const expected = 10 * 3 * 0.25; // 7.5 cubic units
    const actual = calculateQuantityFromElement(element);
    const tolerance = 0.001;

    return {
      testName: 'Wall Quantity Calculation',
      passed: Math.abs(actual - expected) < tolerance,
      message: Math.abs(actual - expected) < tolerance 
        ? 'Wall quantity calculated correctly'
        : `Expected ${expected}, got ${actual}`,
      expected,
      actual,
      tolerance
    };
  }

  static testBeamQuantity(): TestResult {
    const element = {
      element_type: 'beam',
      geometry: {
        length: 20,
        cross_section_area: 0.5
      }
    };

    const expected = 20 * 0.5; // 10 cubic units
    const actual = calculateQuantityFromElement(element);
    const tolerance = 0.001;

    return {
      testName: 'Beam Quantity Calculation',
      passed: Math.abs(actual - expected) < tolerance,
      message: Math.abs(actual - expected) < tolerance 
        ? 'Beam quantity calculated correctly'
        : `Expected ${expected}, got ${actual}`,
      expected,
      actual,
      tolerance
    };
  }

  static testColumnQuantity(): TestResult {
    const element = {
      element_type: 'column',
      geometry: {
        height: 12,
        cross_section_area: 1.0
      }
    };

    const expected = 12 * 1.0; // 12 cubic units
    const actual = calculateQuantityFromElement(element);
    const tolerance = 0.001;

    return {
      testName: 'Column Quantity Calculation',
      passed: Math.abs(actual - expected) < tolerance,
      message: Math.abs(actual - expected) < tolerance 
        ? 'Column quantity calculated correctly'
        : `Expected ${expected}, got ${actual}`,
      expected,
      actual,
      tolerance
    };
  }

  static testSlabQuantity(): TestResult {
    const element = {
      element_type: 'slab',
      geometry: {
        width: 15,
        length: 20,
        thickness: 0.5
      }
    };

    const expected = 15 * 20 * 0.5; // 150 cubic units
    const actual = calculateQuantityFromElement(element);
    const tolerance = 0.001;

    return {
      testName: 'Slab Quantity Calculation',
      passed: Math.abs(actual - expected) < tolerance,
      message: Math.abs(actual - expected) < tolerance 
        ? 'Slab quantity calculated correctly'
        : `Expected ${expected}, got ${actual}`,
      expected,
      actual,
      tolerance
    };
  }

  static testUnitOfMeasure(): TestResult {
    const wallUnit = getUnitOfMeasureForElement('wall');
    const beamUnit = getUnitOfMeasureForElement('beam');
    const doorUnit = getUnitOfMeasureForElement('door');

    const passed = wallUnit === 'cy' && beamUnit === 'cy' && doorUnit === 'ea';

    return {
      testName: 'Unit of Measure Assignment',
      passed,
      message: passed 
        ? 'Units of measure assigned correctly'
        : `Unexpected units: wall=${wallUnit}, beam=${beamUnit}, door=${doorUnit}`,
      expected: { wall: 'cy', beam: 'cy', door: 'ea' },
      actual: { wall: wallUnit, beam: beamUnit, door: doorUnit }
    };
  }

  static testZeroValues(): TestResult {
    const element = {
      element_type: 'wall',
      geometry: {
        length: 0,
        height: 3,
        thickness: 0.25
      }
    };

    const actual = calculateQuantityFromElement(element);
    const passed = actual === 0;

    return {
      testName: 'Zero Value Handling',
      passed,
      message: passed 
        ? 'Zero values handled correctly'
        : `Expected 0 for zero dimensions, got ${actual}`,
      expected: 0,
      actual
    };
  }

  static testNegativeValues(): TestResult {
    const element = {
      element_type: 'wall',
      geometry: {
        length: -10,
        height: 3,
        thickness: 0.25
      }
    };

    const actual = calculateQuantityFromElement(element);
    const passed = actual <= 0; // Should handle negative values gracefully

    return {
      testName: 'Negative Value Handling',
      passed,
      message: passed 
        ? 'Negative values handled correctly'
        : `Negative values not handled properly, got ${actual}`,
      expected: 'Non-positive result',
      actual
    };
  }

  static runCostCalculationTests(): TestSuite {
    const tests: TestResult[] = [];

    tests.push(this.testCostSummaryCalculation());
    tests.push(this.testEmptyLineItems());
    tests.push(this.testMarkupCalculation());
    tests.push(this.testContingencyCalculation());
    tests.push(this.testLaborHours());

    const passed = tests.filter(t => t.passed).length;
    const failed = tests.length - passed;
    const score = (passed / tests.length) * 100;

    return {
      suiteName: 'Cost Calculations',
      tests,
      passed,
      failed,
      score
    };
  }

  static testCostSummaryCalculation(): TestResult {
    const lineItems = [
      {
        id: '1',
        category: 'material' as const,
        total_cost: 1000,
        total_labor_hours: 0,
        item_description: 'Test Material',
        quantity: 1,
        unit_of_measure: 'ea',
        unit_cost: 1000,
        labor_hours_per_unit: 0,
        waste_factor: 0,
        notes: '',
        cost_database_source: 'custom',
        estimation_id: 'test',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        category: 'labor' as const,
        total_cost: 500,
        total_labor_hours: 20,
        item_description: 'Test Labor',
        quantity: 1,
        unit_of_measure: 'hr',
        unit_cost: 25,
        labor_hours_per_unit: 20,
        waste_factor: 0,
        notes: '',
        cost_database_source: 'custom',
        estimation_id: 'test',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const estimation = {
      id: 'test',
      markup_percentage: 15,
      contingency_percentage: 10,
      name: 'Test',
      description: '',
      status: 'draft' as const,
      labor_rate_per_hour: 25,
      project_id: 'test',
      created_by: 'test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_estimated_cost: 0,
      estimated_duration_days: 0
    };

    const summary = calculateCostSummary(lineItems, estimation);
    
    const expectedSubtotal = 1500; // 1000 + 500
    const expectedMarkup = 225; // 1500 * 0.15
    const expectedContingency = 189.75; // (1500 + 225) * 0.10
    const expectedTotal = 1914.75; // 1500 + 225 + 189.75

    const tolerance = 0.01;
    const passed = 
      Math.abs(summary.subtotal - expectedSubtotal) < tolerance &&
      Math.abs(summary.markup - expectedMarkup) < tolerance &&
      Math.abs(summary.contingency - expectedContingency) < tolerance &&
      Math.abs(summary.totalCost - expectedTotal) < tolerance;

    return {
      testName: 'Cost Summary Calculation',
      passed,
      message: passed 
        ? 'Cost summary calculated correctly'
        : `Calculation mismatch: expected total ${expectedTotal}, got ${summary.totalCost}`,
      expected: { subtotal: expectedSubtotal, markup: expectedMarkup, contingency: expectedContingency, total: expectedTotal },
      actual: { subtotal: summary.subtotal, markup: summary.markup, contingency: summary.contingency, total: summary.totalCost }
    };
  }

  static testEmptyLineItems(): TestResult {
    const lineItems: any[] = [];
    const estimation = {
      id: 'test',
      markup_percentage: 15,
      contingency_percentage: 10,
      name: 'Test',
      description: '',
      status: 'draft' as const,
      labor_rate_per_hour: 25,
      project_id: 'test',
      created_by: 'test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_estimated_cost: 0,
      estimated_duration_days: 0
    };

    const summary = calculateCostSummary(lineItems, estimation);
    const passed = summary.totalCost === 0 && summary.subtotal === 0;

    return {
      testName: 'Empty Line Items Handling',
      passed,
      message: passed 
        ? 'Empty line items handled correctly'
        : `Expected zero costs, got total: ${summary.totalCost}`,
      expected: 0,
      actual: summary.totalCost
    };
  }

  static testMarkupCalculation(): TestResult {
    const lineItems = [{
      id: '1',
      category: 'material' as const,
      total_cost: 1000,
      total_labor_hours: 0,
      item_description: 'Test',
      quantity: 1,
      unit_of_measure: 'ea',
      unit_cost: 1000,
      labor_hours_per_unit: 0,
      waste_factor: 0,
      notes: '',
      cost_database_source: 'custom',
      estimation_id: 'test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }];

    const estimation = {
      id: 'test',
      markup_percentage: 20,
      contingency_percentage: 0,
      name: 'Test',
      description: '',
      status: 'draft' as const,
      labor_rate_per_hour: 25,
      project_id: 'test',
      created_by: 'test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_estimated_cost: 0,
      estimated_duration_days: 0
    };

    const summary = calculateCostSummary(lineItems, estimation);
    const expectedMarkup = 200; // 1000 * 0.20
    const passed = Math.abs(summary.markup - expectedMarkup) < 0.01;

    return {
      testName: 'Markup Calculation',
      passed,
      message: passed 
        ? 'Markup calculated correctly'
        : `Expected markup ${expectedMarkup}, got ${summary.markup}`,
      expected: expectedMarkup,
      actual: summary.markup
    };
  }

  static testContingencyCalculation(): TestResult {
    const lineItems = [{
      id: '1',
      category: 'material' as const,
      total_cost: 1000,
      total_labor_hours: 0,
      item_description: 'Test',
      quantity: 1,
      unit_of_measure: 'ea',
      unit_cost: 1000,
      labor_hours_per_unit: 0,
      waste_factor: 0,
      notes: '',
      cost_database_source: 'custom',
      estimation_id: 'test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }];

    const estimation = {
      id: 'test',
      markup_percentage: 0,
      contingency_percentage: 15,
      name: 'Test',
      description: '',
      status: 'draft' as const,
      labor_rate_per_hour: 25,
      project_id: 'test',
      created_by: 'test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_estimated_cost: 0,
      estimated_duration_days: 0
    };

    const summary = calculateCostSummary(lineItems, estimation);
    const expectedContingency = 150; // 1000 * 0.15
    const passed = Math.abs(summary.contingency - expectedContingency) < 0.01;

    return {
      testName: 'Contingency Calculation',
      passed,
      message: passed 
        ? 'Contingency calculated correctly'
        : `Expected contingency ${expectedContingency}, got ${summary.contingency}`,
      expected: expectedContingency,
      actual: summary.contingency
    };
  }

  static testLaborHours(): TestResult {
    const lineItems = [
      {
        id: '1',
        category: 'labor' as const,
        total_cost: 500,
        total_labor_hours: 20,
        item_description: 'Test Labor 1',
        quantity: 1,
        unit_of_measure: 'hr',
        unit_cost: 25,
        labor_hours_per_unit: 20,
        waste_factor: 0,
        notes: '',
        cost_database_source: 'custom',
        estimation_id: 'test',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        category: 'labor' as const,
        total_cost: 750,
        total_labor_hours: 30,
        item_description: 'Test Labor 2',
        quantity: 1,
        unit_of_measure: 'hr',
        unit_cost: 25,
        labor_hours_per_unit: 30,
        waste_factor: 0,
        notes: '',
        cost_database_source: 'custom',
        estimation_id: 'test',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    const estimation = {
      id: 'test',
      markup_percentage: 0,
      contingency_percentage: 0,
      name: 'Test',
      description: '',
      status: 'draft' as const,
      labor_rate_per_hour: 25,
      project_id: 'test',
      created_by: 'test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_estimated_cost: 0,
      estimated_duration_days: 0
    };

    const summary = calculateCostSummary(lineItems, estimation);
    const expectedLaborHours = 50; // 20 + 30
    const expectedDuration = 7; // Math.ceil(50 / 8)
    const passed = summary.totalLaborHours === expectedLaborHours && summary.estimatedDuration === expectedDuration;

    return {
      testName: 'Labor Hours Calculation',
      passed,
      message: passed 
        ? 'Labor hours calculated correctly'
        : `Expected ${expectedLaborHours} hours, ${expectedDuration} days; got ${summary.totalLaborHours} hours, ${summary.estimatedDuration} days`,
      expected: { hours: expectedLaborHours, days: expectedDuration },
      actual: { hours: summary.totalLaborHours, days: summary.estimatedDuration }
    };
  }

  static runAllTests(): TestSuite[] {
    return [
      this.runQuantityCalculationTests(),
      this.runCostCalculationTests()
    ];
  }
}
