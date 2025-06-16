
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, RefreshCw, AlertTriangle, Zap, Clock, Activity } from 'lucide-react';

interface RenderingIssue {
  id: string;
  type: 'infinite-loop' | 'memory-leak' | 'excessive-renders' | 'dependency-cycle';
  component: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  solution: string;
}

interface IssueCardProps {
  issue: RenderingIssue;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'infinite-loop': return <RefreshCw className="w-4 h-4" />;
      case 'memory-leak': return <AlertTriangle className="w-4 h-4" />;
      case 'excessive-renders': return <Zap className="w-4 h-4" />;
      case 'dependency-cycle': return <Clock className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {getTypeIcon(issue.type)}
          <h4 className="font-medium">{issue.component}</h4>
          <Badge className={getSeverityColor(issue.severity)}>
            {issue.severity.toUpperCase()}
          </Badge>
        </div>
        <Badge variant="outline">{issue.type}</Badge>
      </div>
      
      <p className="text-sm text-muted-foreground">
        {issue.description}
      </p>
      
      <div className="bg-green-50 border border-green-200 rounded p-3">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Recommended Solution:</p>
            <p className="text-sm text-green-700">{issue.solution}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
