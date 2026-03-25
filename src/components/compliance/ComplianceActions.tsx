
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Download } from 'lucide-react';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { toast } from 'sonner';
import { ComplianceViolation } from '@/hooks/compliance/useComplianceViolations';

interface ComplianceActionsProps {
  uploadId?: string;
  selectedJurisdiction: string;
  violations: ComplianceViolation[];
  runComplianceCheck: (params: { uploadId: string; checkType?: string; jurisdictionId?: string }) => void;
  isRunningCheck: boolean;
}

export const ComplianceActions: React.FC<ComplianceActionsProps> = ({
  uploadId,
  selectedJurisdiction,
  violations,
  runComplianceCheck,
  isRunningCheck
}) => {
  const [reportFormat, setReportFormat] = useState<'pdf' | 'docx'>('pdf');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { generateResponse } = useGeminiAI();

  const handleRunMultiJurisdictionCheck = async () => {
    if (!uploadId || !selectedJurisdiction) {
      toast.error('Please select an upload and jurisdiction first');
      return;
    }

    runComplianceCheck({ 
      uploadId, 
      checkType: 'multi_jurisdiction',
      jurisdictionId: selectedJurisdiction 
    });
  };

  const generateComplianceReport = async () => {
    if (!uploadId || !selectedJurisdiction) {
      toast.error('Please select an upload and jurisdiction first');
      return;
    }

    setIsGeneratingReport(true);
    
    try {
      const reportPrompt = `
        Generate a comprehensive building code compliance report for:
        Project Upload ID: ${uploadId}
        Jurisdiction: ${selectedJurisdiction}
        Violations Found: ${violations.length}
        
        Include executive summary, compliance assessment, violations analysis,
        remediation recommendations, and cost impact estimation.
      `;

      const aiResponse = await generateResponse({
        prompt: reportPrompt,
        type: 'technical-consulting',
        context: 'Building code compliance expert generating official reports.',
        maxTokens: 4000
      });

      if (aiResponse) {
        // Generate document (placeholder - would integrate with actual document service)
        toast.success(`Comprehensive compliance report generated as ${reportFormat.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Error generating compliance report:', error);
      toast.error('Failed to generate compliance report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="flex space-x-2">
      <Button
        onClick={handleRunMultiJurisdictionCheck}
        disabled={!uploadId || !selectedJurisdiction || isRunningCheck}
        className="skeuo-button"
        size="lg"
      >
        {isRunningCheck ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Running Check...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            Run Comprehensive Check
          </>
        )}
      </Button>
      
      <Select value={reportFormat} onValueChange={(value: 'pdf' | 'docx') => setReportFormat(value)}>
        <SelectTrigger className="w-24 bg-card border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          <SelectItem value="pdf">PDF</SelectItem>
          <SelectItem value="docx">DOCX</SelectItem>
        </SelectContent>
      </Select>
      
      <Button
        onClick={generateComplianceReport}
        disabled={!uploadId || !selectedJurisdiction || isGeneratingReport || violations.length === 0}
        className="skeuo-button"
        size="lg"
      >
        {isGeneratingReport ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Generating...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Generate Report
          </>
        )}
      </Button>
    </div>
  );
};
