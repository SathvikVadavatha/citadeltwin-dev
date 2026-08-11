import React, { useState } from 'react';
import { LocationInputForm } from '@/components/site-requirements/LocationInputForm';
import { ResolvedLocationSummary } from '@/components/site-requirements/ResolvedLocationSummary';
import { SiteConditionsGrid } from '@/components/site-requirements/SiteConditionsGrid';
import { FederalRequirementsTable } from '@/components/site-requirements/FederalRequirementsTable';
import { JurisdictionLinksSection } from '@/components/site-requirements/JurisdictionLinksSection';
import { useResolveLocation, type ResolveLocationInput } from '@/hooks/site-requirements/useResolveLocation';
import { useFederalRules } from '@/hooks/site-requirements/useFederalRules';
import { useJurisdictionLinks } from '@/hooks/site-requirements/useJurisdictionLinks';
import { AlertCircle } from 'lucide-react';

const DEFAULT_INPUT: ResolveLocationInput = { address: '', zip: '', propertyType: 'commercial' };

export const SiteRequirements: React.FC = () => {
  const [formInput, setFormInput] = useState<ResolveLocationInput>(DEFAULT_INPUT);
  const [editingForm, setEditingForm] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const { resolveLocation, result, isResolving, resolveError, reset } = useResolveLocation();
  const { rules, rulesLoading, rulesError } = useFederalRules(hasSubmitted ? formInput.propertyType : null);
  const { stateLinks, nationalLinks, linksLoading, linksError } = useJurisdictionLinks(
    result?.project.state_code ?? null
  );

  const handleSubmit = async (input: ResolveLocationInput) => {
    setFormInput(input);
    setHasSubmitted(true);
    try {
      await resolveLocation(input);
      setEditingForm(false);
    } catch {
      // resolveError is already populated by the hook; the form stays visible.
    }
  };

  const handleReenter = () => {
    reset();
    setEditingForm(true);
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      {editingForm && (
        <div className="space-y-3">
          <LocationInputForm
            onSubmit={handleSubmit}
            isSubmitting={isResolving}
            initialValues={formInput}
          />
          {resolveError && (
            <div className="flex items-start space-x-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{resolveError.message}</span>
            </div>
          )}
        </div>
      )}

      {!editingForm && result && (
        <ResolvedLocationSummary project={result.project} onReenter={handleReenter} />
      )}

      {hasSubmitted && (
        <>
          <SiteConditionsGrid conditions={result?.siteConditions ?? []} isLoading={isResolving} />

          <FederalRequirementsTable
            rules={rules}
            isLoading={rulesLoading}
            error={rulesError}
            propertyType={formInput.propertyType}
          />

          {result && (
            <JurisdictionLinksSection
              stateName={result.project.state_name}
              placeName={result.project.place_name}
              stateLinks={stateLinks}
              nationalLinks={nationalLinks}
              isLoading={linksLoading}
              error={linksError}
            />
          )}
        </>
      )}

      <div className="text-xs text-muted-foreground border-t border-border pt-4">
        Reference only. This does not review your design and does not determine compliance. It
        does not cover zoning, fire marshal conditions, utility requirements, or state and local
        building codes.
      </div>
    </div>
  );
};
