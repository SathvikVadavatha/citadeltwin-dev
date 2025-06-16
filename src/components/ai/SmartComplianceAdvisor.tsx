
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useDesignAssistant, ComplianceCheck } from '@/hooks/useDesignAssistant';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  XCircle,
  Book,
  Search
} from 'lucide-react';

const JURISDICTIONS = [
  'International Building Code (IBC)',
  'International Residential Code (IRC)',
  'California Building Code (CBC)',
  'New York Building Code',
  'Florida Building Code',
  'Texas Building Code',
  'NFPA Codes',
  'ADA Requirements',
  'OSHA Standards'
];

const BUILDING_TYPES = [
  'Single Family Residential',
  'Multi-Family Residential',
  'Commercial Office',
  'Retail/Commercial',
  'Industrial/Manufacturing',
  'Healthcare Facility',
  'Educational Facility',
  'High-Rise Building',
  'Mixed Use Development'
];

export const SmartComplianceAdvisor: React.FC = () => {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('');
  const [selectedBuildingType, setSelectedBuildingType] = useState('');
  const [designDescription, setDesignDescription] = useState('');
  const { isAnalyzing, complianceChecks, checkCompliance } = useDesignAssistant();

  const runComplianceCheck = async () => {
    if (!designDescription.trim()) return;
    
    await checkCompliance(designDescription, selectedJurisdiction, selectedBuildingType);
  };

  const getStatusIcon = (status: ComplianceCheck['status']) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'non-compliant':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'review-needed':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'not-applicable':
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
      default:
        return <Shield className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: ComplianceCheck['status']) => {
    switch (status) {
      case 'compliant':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'non-compliant':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'review-needed':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'not-applicable':
        return 'text-gray-700 bg-gray-50 border-gray-200';
      default:
        return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  const getComplianceStats = () => {
    const total = complianceChecks.length;
    const compliant = complianceChecks.filter(c => c.status === 'compliant').length;
    const nonCompliant = complianceChecks.filter(c => c.status === 'non-compliant').length;
    const reviewNeeded = complianceChecks.filter(c => c.status === 'review-needed').length;
    
    return { total, compliant, nonCompliant, reviewNeeded };
  };

  const stats = getComplianceStats();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Smart Compliance Advisor
          </CardTitle>
          <CardDescription>
            AI-powered building code compliance analysis and guidance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Jurisdiction/Code</label>
              <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select building code or jurisdiction" />
                </SelectTrigger>
                <SelectContent>
                  {JURISDICTIONS.map(jurisdiction => (
                    <SelectItem key={jurisdiction} value={jurisdiction}>
                      {jurisdiction}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Building Type</label>
              <Select value={selectedBuildingType} onValueChange={setSelectedBuildingType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select building type" />
                </SelectTrigger>
                <SelectContent>
                  {BUILDING_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Design Description</label>
            <Textarea
              value={designDescription}
              onChange={(e) => setDesignDescription(e.target.value)}
              placeholder="Describe your design including structural systems, materials, occupancy, fire safety systems, accessibility features, etc."
              rows={4}
            />
          </div>

          <Button
            onClick={runComplianceCheck}
            disabled={isAnalyzing || !designDescription.trim()}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Checking Compliance...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Run Compliance Check
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {complianceChecks.length > 0 && (
        <>
          {/* Compliance Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Checks</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Book className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Compliant</p>
                    <p className="text-2xl font-bold text-green-600">{stats.compliant}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Issues</p>
                    <p className="text-2xl font-bold text-red-600">{stats.nonCompliant}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Review Needed</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.reviewNeeded}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Results */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance Check Results</CardTitle>
              <CardDescription>
                Detailed analysis of building code compliance for your design
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {complianceChecks.map((check) => (
                    <Card key={check.id} className={`border ${getStatusColor(check.status)}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(check.status)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{check.code}</Badge>
                              <Badge variant="secondary">{check.section}</Badge>
                              <Badge className={getStatusColor(check.status)}>
                                {check.status.replace('-', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            
                            <h4 className="font-medium mb-1">{check.requirement}</h4>
                            
                            {check.notes && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {check.notes}
                              </p>
                            )}
                            
                            {check.recommendations && check.recommendations.length > 0 && (
                              <div className="mt-3">
                                <h5 className="text-sm font-medium mb-1">Recommendations:</h5>
                                <ul className="text-sm space-y-1">
                                  {check.recommendations.map((rec, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <div className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
