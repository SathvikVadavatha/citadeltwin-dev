
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Share, 
  Calendar,
  TrendingUp,
  BarChart3
} from 'lucide-react';

interface TestingSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  overallScore: number;
  lastRunAt: Date | null;
}

interface TestReportGeneratorProps {
  testingSummary: TestingSummary;
  uploadId?: string;
  projectId?: string;
}

export const TestReportGenerator: React.FC<TestReportGeneratorProps> = ({ 
  testingSummary, 
  uploadId, 
  projectId 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportHistory, setReportHistory] = useState([
    {
      id: '1',
      name: 'Comprehensive Test Report - Nov 2024',
      generatedAt: new Date('2024-11-15'),
      score: 87,
      totalTests: 42,
      type: 'comprehensive'
    },
    {
      id: '2',
      name: 'Model Validation Report - Nov 2024',
      generatedAt: new Date('2024-11-10'),
      score: 92,
      totalTests: 15,
      type: 'validation'
    },
    {
      id: '3',
      name: 'Performance Analysis Report - Nov 2024',
      generatedAt: new Date('2024-11-08'),
      score: 78,
      totalTests: 8,
      type: 'performance'
    }
  ]);

  const generateReport = async (reportType: 'comprehensive' | 'validation' | 'performance' | 'security') => {
    setIsGenerating(true);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newReport = {
        id: Date.now().toString(),
        name: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Test Report - ${new Date().toLocaleDateString()}`,
        generatedAt: new Date(),
        score: testingSummary.overallScore,
        totalTests: testingSummary.totalTests,
        type: reportType
      };
      
      setReportHistory(prev => [newReport, ...prev]);
      
      // In a real implementation, this would generate and download the actual report
      console.log(`Generated ${reportType} report`);
      
    } catch (error) {
      console.error('Report generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'comprehensive': return 'bg-blue-500/20 text-blue-600 border-blue-600/50';
      case 'validation': return 'bg-green-500/20 text-green-600 border-green-600/50';
      case 'performance': return 'bg-purple-500/20 text-purple-600 border-purple-600/50';
      case 'security': return 'bg-red-500/20 text-destructive border-destructive/50';
      default: return 'bg-gray-500/20 text-muted-foreground border-gray-400/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          Test Report Generator
        </h3>
        <p className="text-muted-foreground">
          Generate comprehensive testing reports and track historical data
        </p>
      </div>

      {/* Current Test Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Current Test Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{testingSummary.totalTests}</div>
              <div className="text-sm text-muted-foreground">Total Tests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{testingSummary.passedTests}</div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{testingSummary.failedTests}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{testingSummary.warningTests}</div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${testingSummary.overallScore >= 80 ? 'text-green-500' : testingSummary.overallScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                {testingSummary.overallScore}%
              </div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
          </div>
          {testingSummary.lastRunAt && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Last run: {testingSummary.lastRunAt.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => generateReport('comprehensive')}
              disabled={isGenerating}
              className="flex flex-col items-center gap-2 h-auto p-4"
              variant="outline"
            >
              <FileText className="w-6 h-6" />
              <span className="text-xs">Comprehensive Report</span>
            </Button>
            <Button
              onClick={() => generateReport('validation')}
              disabled={isGenerating}
              className="flex flex-col items-center gap-2 h-auto p-4"
              variant="outline"
            >
              <TrendingUp className="w-6 h-6" />
              <span className="text-xs">Validation Report</span>
            </Button>
            <Button
              onClick={() => generateReport('performance')}
              disabled={isGenerating}
              className="flex flex-col items-center gap-2 h-auto p-4"
              variant="outline"
            >
              <BarChart3 className="w-6 h-6" />
              <span className="text-xs">Performance Report</span>
            </Button>
            <Button
              onClick={() => generateReport('security')}
              disabled={isGenerating}
              className="flex flex-col items-center gap-2 h-auto p-4"
              variant="outline"
            >
              <Share className="w-6 h-6" />
              <span className="text-xs">Security Report</span>
            </Button>
          </div>
          {isGenerating && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Generating report...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Report History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reportHistory.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">{report.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {report.generatedAt.toLocaleDateString()} • {report.totalTests} tests
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getReportTypeColor(report.type)}>
                    {report.type}
                  </Badge>
                  <Badge className={report.score >= 80 ? 'bg-green-500/20 text-green-600' : report.score >= 60 ? 'bg-yellow-500/20 text-yellow-600' : 'bg-red-500/20 text-destructive'}>
                    {report.score}%
                  </Badge>
                  <Button size="sm" variant="ghost">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
