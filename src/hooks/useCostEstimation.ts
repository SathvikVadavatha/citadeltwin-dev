
import { useState } from 'react';
import { useCostEstimationCore } from './cost-estimation/useCostEstimationCore';
import { useLineItems } from './cost-estimation/useLineItems';
import { calculateCostSummary } from '@/utils/cost-estimation/costCalculations';
import type { CostEstimation } from '@/types/cost-estimation';

export const useCostEstimation = (projectId?: string) => {
  const [currentEstimation, setCurrentEstimation] = useState<CostEstimation | null>(null);
  
  const {
    estimations,
    loading,
    creating,
    updating,
    createEstimation,
    updateEstimation,
    refreshEstimations,
  } = useCostEstimationCore(projectId);

  const {
    lineItems,
    addLineItem,
    updateLineItem,
    deleteLineItem,
  } = useLineItems(currentEstimation);

  return {
    estimations,
    currentEstimation,
    setCurrentEstimation,
    lineItems,
    loading,
    creating,
    updating,
    createEstimation,
    updateEstimation,
    addLineItem,
    updateLineItem,
    deleteLineItem,
    calculateCostSummary,
    refreshEstimations,
  };
};
