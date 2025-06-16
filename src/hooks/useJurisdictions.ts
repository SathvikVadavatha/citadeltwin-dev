
import { useState } from 'react';
import { useJurisdictionsCore } from './jurisdictions/useJurisdictionsCore';
import { useJurisdictionSearch } from './jurisdictions/useJurisdictionSearch';
import { useJurisdictionDetails } from './jurisdictions/useJurisdictionDetails';

export const useJurisdictions = () => {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string | null>(null);
  
  const { jurisdictions, jurisdictionsLoading } = useJurisdictionsCore();
  const { searchJurisdictionsByLocation } = useJurisdictionSearch();
  const { getApplicableCodes, getComplianceRequirements } = useJurisdictionDetails();

  return {
    jurisdictions,
    jurisdictionsLoading,
    selectedJurisdiction,
    setSelectedJurisdiction,
    searchJurisdictionsByLocation,
    getApplicableCodes,
    getComplianceRequirements,
  };
};

// Re-export types for backward compatibility
export type { Jurisdiction } from './jurisdictions/useJurisdictionsCore';
export type { JurisdictionCode } from './jurisdictions/useJurisdictionDetails';
