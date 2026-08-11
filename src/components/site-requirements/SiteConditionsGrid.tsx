import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import type { ReqSiteCondition } from '@/hooks/site-requirements/useResolveLocation';

interface SiteConditionsGridProps {
  conditions: ReqSiteCondition[];
  isLoading: boolean;
}

export const SiteConditionsGrid: React.FC<SiteConditionsGridProps> = ({ conditions, isLoading }) => {
  return (
    <Card className="skeuo-card">
      <CardHeader>
        <CardTitle className="text-lg">Site conditions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : conditions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No site conditions retrieved yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {conditions.map((c) => {
              const unavailable = c.value === 'Unavailable';
              return (
                <div
                  key={c.id}
                  className="rounded-lg border border-border p-4 space-y-1 bg-card"
                >
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {c.label}
                  </div>
                  {unavailable ? (
                    <div className="flex items-center space-x-1.5 text-destructive">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-medium">Unavailable</span>
                    </div>
                  ) : (
                    <div className="text-xl font-semibold text-foreground">
                      {c.value}
                      {c.unit ? <span className="text-sm font-normal ml-1">{c.unit}</span> : null}
                    </div>
                  )}
                  {c.note && <div className="text-xs text-muted-foreground">{c.note}</div>}
                  <div className="text-xs text-muted-foreground pt-1">
                    Source: {c.source}
                    {c.source_edition ? ` (${c.source_edition})` : ''} · retrieved{' '}
                    {new Date(c.retrieved_at).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-4">
          Wind speed, ground snow load, and ice thickness are not shown yet — those data sources
          require a terms-of-use review before we integrate them.
        </p>
      </CardContent>
    </Card>
  );
};
