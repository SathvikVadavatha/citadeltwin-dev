
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Mail, 
  Printer,
  Image,
  BarChart3,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface FEAReportGeneratorProps {
  analysisId: string;
}

export const FEAReportGenerator: React.FC<FEAReportGeneratorProps> = ({
  analysisId
}) => {
  const [reportTemplate, setReportTemplate] = useState('standard');
  const [includeSections, setIncludeSections] = useState({
    executive_summary: true,
    model_description: true,
    material_properties: true,
    loading_conditions: true,
    mesh_information: true,
    results_summary: true,
    stress_analysis: true,
    displacement_analysis: true,
    safety_factors: true,
    conclusions: true,
    appendices: false
  });

  const [generatingReport, setGeneratingReport] = useState(false);

  const generateReport = async () => {
    setGeneratingReport(true);
    // Simulate report generation
    setTimeout(() => {
      setGeneratingReport(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Automated FEA Report Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Report Template</Label>
              <Select value={reportTemplate} onValueChange={setReportTemplate}>
                <SelectTrigger className="skeuo-button">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Engineering Report</SelectItem>
                  <SelectItem value="structural">Structural Analysis Report</SelectItem>
                  <SelectItem value="compliance">Code Compliance Report</SelectItem>
                  <SelectItem value="research">Research Analysis Report</SelectItem>
                  <SelectItem value="client">Client Presentation Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Output Format</Label>
              <Select defaultValue="pdf">
                <SelectTrigger className="skeuo-button">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="docx">Word Document</SelectItem>
                  <SelectItem value="html">HTML Report</SelectItem>
                  <SelectItem value="pptx">PowerPoint Presentation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Report Information</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project Title</Label>
                <Input 
                  placeholder="Enter project title"
                  className="skeuo-button"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Engineer Name</Label>
                <Input 
                  placeholder="Enter engineer name"
                  className="skeuo-button"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <Input 
                  placeholder="Enter company name"
                  className="skeuo-button"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Report Date</Label>
                <Input 
                  type="date"
                  className="skeuo-button"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Project Description</Label>
              <Textarea 
                placeholder="Enter project description and analysis objectives"
                className="skeuo-button"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Report Sections</h4>
            
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(includeSections).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    checked={value}
                    onCheckedChange={(checked) => 
                      setIncludeSections(prev => ({ ...prev, [key]: checked as boolean }))
                    }
                  />
                  <Label className="text-sm">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Report Content Preview</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Analysis results validated</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>High-quality visualizations ready</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span>Include material certificates (if available)</span>
              </div>
              <div className="text-muted-foreground">
                Estimated report length: 25-30 pages
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Report Features</h4>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Automated charts and graphs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-green-500" />
                  <span className="text-sm">High-resolution result images</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Professional formatting</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Code compliance summary</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Safety factor analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Detailed result tables</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              className="skeuo-button flex-1"
              onClick={generateReport}
              disabled={generatingReport || !analysisId}
            >
              <FileText className="h-4 w-4 mr-2" />
              {generatingReport ? 'Generating Report...' : 'Generate Report'}
            </Button>
            
            <Button variant="outline" className="skeuo-button">
              <Download className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>

          {generatingReport && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center gap-2 mb-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="font-medium">Generating Report...</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Processing analysis results and creating visualizations...
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-orange-500" />
            Report Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email Recipients</Label>
            <Input 
              placeholder="Enter email addresses (comma-separated)"
              className="skeuo-button"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="skeuo-button">
              <Mail className="h-4 w-4 mr-2" />
              Email Report
            </Button>
            
            <Button variant="outline" className="skeuo-button">
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
