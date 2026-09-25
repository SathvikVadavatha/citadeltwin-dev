import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, MapPin } from 'lucide-react';
import type { ReqProject } from '@/hooks/site-requirements/useResolveLocation';

interface ResolvedLocationSummaryProps {
  project: ReqProject;
  onReenter: () => void;
}

export const ResolvedLocationSummary: React.FC<ResolvedLocationSummaryProps> = ({
  project,
  onReenter,
}) => {
  const isApproximate = project.geocode_match_quality === 'approximate';

  return (
    <Card className="skeuo-card">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <MapPin className="w-5 h-5 text-primary" />
          <span>Resolved location</span>
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onReenter}>
          Not right?
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">City / Place</div>
            <div className="font-medium">{project.place_name ?? '—'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">County</div>
            <div className="font-medium">{project.county_name ?? '—'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">State</div>
            <div className="font-medium">
              {project.state_name ?? '—'} {project.state_code ? `(${project.state_code})` : ''}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">County FIPS</div>
            <div className="font-medium">{project.fips_code ?? '—'}</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Entered: {project.input_address}, {project.input_zip} ·{' '}
          <Badge variant="outline" className="ml-1">
            {project.property_type}
          </Badge>
        </div>
        {isApproximate && (
          <div className="flex items-start space-x-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              This address matched approximately. Double-check the resolved location before relying on it.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
