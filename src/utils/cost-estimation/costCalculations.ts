
import type { CostLineItem, CostEstimation, CostSummary } from '@/types/cost-estimation';

export const calculateCostSummary = (items: CostLineItem[], estimation: CostEstimation): CostSummary => {
  const materialCost = items.filter(item => item.category === 'material').reduce((sum, item) => sum + item.total_cost, 0);
  const laborCost = items.filter(item => item.category === 'labor').reduce((sum, item) => sum + item.total_cost, 0);
  const equipmentCost = items.filter(item => item.category === 'equipment').reduce((sum, item) => sum + item.total_cost, 0);
  
  const subtotal = materialCost + laborCost + equipmentCost;
  const markup = subtotal * (estimation.markup_percentage / 100);
  const contingency = (subtotal + markup) * (estimation.contingency_percentage / 100);
  const totalCost = subtotal + markup + contingency;
  
  const totalLaborHours = items.reduce((sum, item) => sum + item.total_labor_hours, 0);
  const estimatedDuration = Math.ceil(totalLaborHours / 8);

  return {
    totalMaterialCost: materialCost,
    totalLaborCost: laborCost,
    totalEquipmentCost: equipmentCost,
    subtotal,
    markup,
    contingency,
    totalCost,
    totalLaborHours,
    estimatedDuration,
  };
};
