import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ExternalLink } from 'lucide-react';
import type { FederalRule } from '@/hooks/site-requirements/useFederalRules';

interface FederalRequirementsTableProps {
  rules: FederalRule[];
  isLoading: boolean;
  error?: Error | null;
  propertyType: 'residential' | 'commercial';
}

export const FederalRequirementsTable: React.FC<FederalRequirementsTableProps> = ({
  rules,
  isLoading,
  error,
  propertyType,
}) => {
  // Notes-only rows (e.g. "ADA generally doesn't apply to single-family homes")
  // are rendered as prose, not as a requirement in the table.
  const noteRows = rules.filter((r) => r.comparator === 'note');
  const requirementRows = rules.filter((r) => r.comparator !== 'note');

  return (
    <Card className="skeuo-card">
      <CardHeader>
        <CardTitle className="text-lg">Federal requirements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {propertyType === 'residential' &&
          noteRows.map((n) => (
            <div
              key={n.id}
              className="rounded-md border border-border bg-muted/50 p-3 text-sm text-foreground"
            >
              {n.note ?? n.requirement}
            </div>
          ))}

        {error ? (
          <div className="flex items-start space-x-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Federal requirements are unavailable right now: {error.message}</span>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : requirementRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No federal requirements are seeded for this property type yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requirement</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Citation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requirementRows.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div className="font-medium">{rule.requirement}</div>
                      {rule.note && (
                        <div className="text-xs text-muted-foreground">{rule.note}</div>
                      )}
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        {rule.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {rule.comparator === 'min' && '≥ '}
                      {rule.comparator === 'max' && '≤ '}
                      {rule.value}
                      {rule.unit ? ` ${rule.unit}` : ''}
                    </TableCell>
                    <TableCell>
                      <a
                        href={rule.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-primary hover:underline"
                      >
                        <span>{rule.citation}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
