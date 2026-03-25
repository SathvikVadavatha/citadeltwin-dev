
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Download, FileText, BarChart3, Shield, Activity, Loader2 } from 'lucide-react';
import { format } from "date-fns";
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { ReportGenerator } from '@/services/reportGenerator';
import { ReportType, OutputFormat } from '@/types/reports';
import { toast } from '@/hooks/use-toast';

const reportTypes = [
  { value: 'compliance', label: 'Compliance Report', icon: Shield },
  { value: 'fea_analysis', label: 'FEA Analysis Report', icon: BarChart3 },
  { value: 'activity', label: 'Activity Report', icon: Activity },
  { value: 'performance', label: 'Performance Report', icon: FileText },
];

const formatOptions = [
  { value: 'pdf', label: 'PDF Document' },
  { value: 'csv', label: 'CSV Spreadsheet' },
  { value: 'json', label: 'JSON Data' },
];

const projectScopes = [
  { value: 'all', label: 'All Projects' },
  { value: 'active', label: 'Active Projects Only' },
  { value: 'completed', label: 'Completed Projects Only' },
  { value: 'recent', label: 'Recent Projects (Last 30 days)' },
];

export const CustomReportBuilder: React.FC = () => {
  const [reportType, setReportType] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [projectScope, setProjectScope] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedReportType = reportTypes.find(type => type.value === reportType);
  const ReportIcon = selectedReportType?.icon || FileText;

  const isFormComplete = reportType && dateRange?.from && dateRange?.to && projectScope && outputFormat;

  const handleGenerateReport = async () => {
    if (!isFormComplete || !dateRange?.from || !dateRange?.to) return;

    setIsGenerating(true);
    try {
      const report = await ReportGenerator.generateReport(
        reportType as ReportType,
        { from: dateRange.from, to: dateRange.to },
        outputFormat as OutputFormat
      );

      // Download the file
      ReportGenerator.downloadFile(report.content, report.filename, report.mimeType);
      
      toast({
        title: "Report Generated Successfully",
        description: `Your ${selectedReportType?.label} has been downloaded as ${outputFormat.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Report generation failed:', error);
      toast({
        title: "Report Generation Failed",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="skeuo-panel">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold">Custom Report Builder</CardTitle>
            <CardDescription>
              Generate custom reports with specific parameters and data ranges
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* First Row: Report Type and Date Range */}
        <div className="grid grid-cols-2 gap-4">
          {/* Report Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Report Type</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type">
                  {selectedReportType && (
                    <div className="flex items-center gap-2">
                      <ReportIcon className="h-4 w-4" />
                      <span>{selectedReportType.label}</span>
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {reportTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "MMM dd")} -{" "}
                          {format(dateRange.to, "MMM dd, yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "MMM dd, yyyy")
                      )
                    ) : (
                      "Pick a date range"
                    )}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  disabled={(date) => date > new Date()}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Second Row: Project Scope and Output Format */}
        <div className="grid grid-cols-2 gap-4">
          {/* Project Scope Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Project Scope</label>
            <Select value={projectScope} onValueChange={setProjectScope}>
              <SelectTrigger>
                <SelectValue placeholder="Select project scope" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {projectScopes.map((scope) => (
                  <SelectItem key={scope.value} value={scope.value}>
                    {scope.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Output Format</label>
            <Select value={outputFormat} onValueChange={setOutputFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Select output format" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {formatOptions.map((formatOption) => (
                  <SelectItem key={formatOption.value} value={formatOption.value}>
                    {formatOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Report Summary */}
        {isFormComplete && (
          <div className="p-4 rounded-lg bg-muted/50 border border-muted-foreground/20">
            <h4 className="text-sm font-medium mb-2 text-foreground">Report Summary</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                {selectedReportType?.label}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {projectScopes.find(s => s.value === projectScope)?.label}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {formatOptions.find(f => f.value === outputFormat)?.label}
              </Badge>
              {dateRange?.from && dateRange?.to && (
                <Badge variant="secondary" className="text-xs">
                  {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Generate Report Button */}
        <Button 
          className="w-full"
          disabled={!isFormComplete || isGenerating}
          onClick={handleGenerateReport}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate Report
            </>
          )}
        </Button>

        {/* Past Reports Section */}
        <div className="pt-4 border-t border-muted-foreground/20">
          <h4 className="text-sm font-medium mb-3 text-foreground">Recent Reports</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-muted-foreground/10">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Compliance Report</p>
                  <p className="text-xs text-muted-foreground">Generated 2 days ago • PDF</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" disabled>
                <Download className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-muted-foreground/10">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">FEA Analysis Report</p>
                  <p className="text-xs text-muted-foreground">Generated 1 week ago • CSV</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" disabled>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
