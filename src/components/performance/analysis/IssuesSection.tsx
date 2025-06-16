
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { IssueCard } from './IssueCard';

interface RenderingIssue {
  id: string;
  type: 'infinite-loop' | 'memory-leak' | 'excessive-renders' | 'dependency-cycle';
  component: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  solution: string;
}

interface IssuesSectionProps {
  issues: RenderingIssue[];
  isAnalyzing: boolean;
}

export const IssuesSection: React.FC<IssuesSectionProps> = ({ issues, isAnalyzing }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Detected Rendering Issues ({issues.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
          
          {issues.length === 0 && !isAnalyzing && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p>No rendering issues detected</p>
              <p className="text-sm">Run analysis to check for potential problems</p>
            </div>
          )}
          
          {isAnalyzing && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p>Analyzing rendering patterns...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
