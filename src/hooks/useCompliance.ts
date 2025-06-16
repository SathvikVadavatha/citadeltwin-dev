
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
  const violationsHook = useComplianceViolations();
  const checksHook = useComplianceChecks();

  return {
    // Rules
    complianceRules: rulesHook.complianceRules,
    rulesLoading: rulesHook.rulesLoading,
    rulesError: rulesHook.rulesError,
    
    // Violations  
    fetchViolations: (uploadId?: string) => useComplianceViolations(uploadId),
    
    // Checks
    fetchComplianceChecks: (uploadId?: string) => useComplianceChecks(uploadId),
    runComplianceCheck: checksHook.runComplianceCheck,
    isRunningCheck: checksHook.isRunningCheck,
    
    // Violation management
    updateViolationStatus: violationsHook.updateViolationStatus,
  };
};
