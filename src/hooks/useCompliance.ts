

// Import the specialized hooks
import { useComplianceRules } from './compliance/useComplianceRules';
import { useComplianceViolations } from './compliance/useComplianceViolations';
import { useComplianceChecks } from './compliance/useComplianceChecks';

// Re-export specialized hooks for backward compatibility
export { useComplianceRules } from './compliance/useComplianceRules';
export { useComplianceViolations } from './compliance/useComplianceViolations';
export { useComplianceChecks } from './compliance/useComplianceChecks';

// Re-export types for backward compatibility
export type { ComplianceRule } from './compliance/useComplianceRules';
export type { ComplianceViolation } from './compliance/useComplianceViolations';
export type { ComplianceCheck } from './compliance/useComplianceChecks';

// Main composite hook that combines all compliance functionality
export const useCompliance = () => {
  const rulesHook = useComplianceRules();

  return {
    // Rules
    complianceRules: rulesHook.complianceRules,
    rulesLoading: rulesHook.rulesLoading,
    rulesError: rulesHook.rulesError,
    
    // Return hook functions that can be called with uploadId
    fetchViolations: (uploadId?: string) => useComplianceViolations(uploadId),
    fetchComplianceChecks: (uploadId?: string) => useComplianceChecks(uploadId),
    
    // For cases where uploadId is not needed upfront
    useComplianceViolations,
    useComplianceChecks,
  };
};
