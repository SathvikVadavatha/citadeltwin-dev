
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Book, CheckCircle } from 'lucide-react';
import { type ComplianceRule } from '@/hooks/useCompliance';

interface ComplianceRulesListProps {
  rules: ComplianceRule[];
  isLoading: boolean;
}

export const ComplianceRulesList: React.FC<ComplianceRulesListProps> = ({
  rules,
  isLoading,
}) => {
  const getRuleTypeColor = (ruleType: string) => {
    switch (ruleType) {
      case 'height_limit':
        return 'bg-blue-900 text-blue-300 border-blue-700';
      case 'area_limit':
        return 'bg-green-900 text-green-300 border-green-700';
      case 'egress':
        return 'bg-yellow-900 text-yellow-300 border-yellow-700';
      case 'fire_rating':
        return 'bg-red-900 text-red-300 border-red-700';
      case 'structural':
        return 'bg-purple-900 text-purple-300 border-purple-700';
      case 'occupancy':
        return 'bg-primary/20 text-primary border-primary';
      default:
        return 'bg-card text-foreground border-border';
    }
  };

  if (isLoading) {
    return (
      <Card className="skeuo-panel">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading rules...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="skeuo-panel">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Book className="w-5 h-5 text-primary" />
            <CardTitle>Building Code Rules Database</CardTitle>
          </div>
          <CardDescription>
            Currently loaded: {rules.length} active rules from various jurisdictions
          </CardDescription>
        </CardHeader>
      </Card>

      {rules.map((rule) => (
        <Card key={rule.id} className="skeuo-panel">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-lg">{rule.title}</CardTitle>
                  <Badge className={getRuleTypeColor(rule.rule_type)}>
                    {rule.rule_type.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className="border-primary text-primary">
                    {rule.jurisdiction}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Section: {rule.code_section}</span>
                  {rule.is_active && (
                    <>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span className="text-green-600">Active</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-foreground mb-4">{rule.description}</p>
            
            <div>
              <h4 className="font-semibold text-primary mb-2">Rule Logic</h4>
              <pre className="text-sm bg-card p-3 rounded border border-border overflow-x-auto">
                {JSON.stringify(rule.rule_logic, null, 2)}
              </pre>
            </div>

            <div className="mt-4 text-xs text-muted-foreground">
              Last updated: {new Date(rule.updated_at).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
