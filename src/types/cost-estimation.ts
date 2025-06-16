
export interface CostEstimation {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  total_estimated_cost: number;
  markup_percentage: number;
  contingency_percentage: number;
  estimated_duration_days?: number;
  labor_rate_per_hour: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CostLineItem {
  id: string;
  estimation_id: string;
  element_id?: string;
  category: 'material' | 'labor' | 'equipment' | 'overhead' | 'contingency';
  item_code?: string;
  item_description: string;
  quantity: number;
  unit_of_measure: string;
  unit_cost: number;
  total_cost: number;
  labor_hours_per_unit: number;
  total_labor_hours: number;
  waste_factor: number;
  notes?: string;
  cost_database_source: 'rs_means' | 'craftsman' | 'bni' | 'custom';
  created_at: string;
  updated_at: string;
}

export interface CostDatabase {
  id: string;
  provider: 'rs_means' | 'craftsman' | 'bni' | 'custom';
  item_code: string;
  item_description: string;
  category: 'material' | 'labor' | 'equipment' | 'overhead' | 'contingency';
  unit_of_measure: string;
  base_cost: number;
  labor_hours_per_unit: number;
  location_factor: number;
  effective_date: string;
  expiry_date?: string;
  created_at: string;
}

export interface ProjectBudget {
  id: string;
  project_id: string;
  estimation_id?: string;
  approved_budget: number;
  contingency_budget: number;
  spent_to_date: number;
  remaining_budget: number;
  budget_status: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface QuantityTakeoff {
  id: string;
  estimation_id: string;
  element_id: string;
  material_id?: string;
  calculated_quantity: number;
  unit_of_measure: string;
  calculation_method?: string;
  geometry_data?: any;
  created_at: string;
  updated_at: string;
}

export interface CostCalculationParams {
  elements: any[];
  materials: any[];
  laborRate: number;
  markupPercentage: number;
  contingencyPercentage: number;
  locationFactor: number;
}

export interface CostSummary {
  totalMaterialCost: number;
  totalLaborCost: number;
  totalEquipmentCost: number;
  subtotal: number;
  markup: number;
  contingency: number;
  totalCost: number;
  totalLaborHours: number;
  estimatedDuration: number;
}
