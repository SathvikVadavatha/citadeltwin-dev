import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ExternalLink } from 'lucide-react';
import type { JurisdictionLink } from '@/hooks/site-requirements/useJurisdictionLinks';

interface JurisdictionLinksSectionProps {
  stateName: string | null;
  placeName: string | null;
  stateLinks: JurisdictionLink[];
  nationalLinks: JurisdictionLink[];
  isLoading: boolean;
  error?: Error | null;
}

const LinkRow: React.FC<{ link: JurisdictionLink }> = ({ link }) => (
  <a
    href={link.url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-start justify-between rounded-md border border-border p-3 hover:bg-accent transition-colors"
  >
    <div>
      <div className="font-medium text-sm text-foreground">{link.label}</div>
      {link.note && <div className="text-xs text-muted-foreground mt-0.5">{link.note}</div>}
    </div>
    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2 mt-0.5" />
  </a>
);

export const JurisdictionLinksSection: React.FC<JurisdictionLinksSectionProps> = ({
  stateName,
  placeName,
  stateLinks,
  nationalLinks,
  isLoading,
  error,
}) => {
  const locationLabel = [placeName, stateName].filter(Boolean).join(', ') || 'this location';

  return (
    <Card className="skeuo-card">
      <CardHeader>
        <CardTitle className="text-lg">State and local</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-border bg-muted/50 p-3 text-sm text-foreground">
          We do not hold {locationLabel} building code requirements. We cannot tell you which
          code edition applies at this address. Confirm with your local building department
          before relying on anything here.
        </div>

        {error ? (
          <div className="flex items-start space-x-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>State and local links are unavailable right now: {error.message}</span>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <>
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                {stateName ?? 'State'} resources
              </div>
              {stateLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No state-specific links are on file yet for this state. Use the national
                  resources below, or search your state government site directly.
                </p>
              ) : (
                <div className="space-y-2">
                  {stateLinks.map((link) => (
                    <LinkRow key={link.id} link={link} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                National resources
              </div>
              <div className="space-y-2">
                {nationalLinks.map((link) => (
                  <LinkRow key={link.id} link={link} />
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
