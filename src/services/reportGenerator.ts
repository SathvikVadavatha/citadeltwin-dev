import { format, subDays, addDays } from 'date-fns';
import { ReportData, ReportOutput, ReportType, OutputFormat } from '@/types/reports';
import { complianceReportTemplate, activityReportTemplate } from '@/data/reportTemplates';
const feaAnalysisReportTemplate: any = activityReportTemplate;
import { PDFFormatter } from './reportFormatters/pdfFormatter';
import { CSVFormatter } from './reportFormatters/csvFormatter';
import { JSONFormatter } from './reportFormatters/jsonFormatter';

export class ReportGenerator {
  static async generateReport(
    reportType: ReportType,
    dateRange: { from: Date; to: Date },
    outputFormat: OutputFormat
  ): Promise<ReportOutput> {
    // Get the appropriate template
    const template = this.getTemplate(reportType);
    
    // Populate dates
    const reportData = this.populateReportData(template, dateRange);
    
    // Generate content based on format
    const { content, mimeType } = await this.formatReport(reportData, reportType, outputFormat);
    
    // Generate filename
    const filename = this.generateFilename(reportType, outputFormat);
    
    return {
      data: reportData,
      content,
      filename,
      mimeType
    };
  }

  private static getTemplate(reportType: ReportType): ReportData {
    switch (reportType) {
      case 'compliance':
        return { ...complianceReportTemplate };
      case 'activity':
        return { ...activityReportTemplate };
      case 'fea_analysis' as any:
        return { ...feaAnalysisReportTemplate };
      case 'performance':
        // For now, use activity report as performance report
        return { ...activityReportTemplate };
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  private static populateReportData(template: ReportData, dateRange: { from: Date; to: Date }): ReportData {
    const endDate = dateRange.to;
    const startDate = dateRange.from;
    
    // Convert template to string, replace placeholders, then parse back
    let templateStr = JSON.stringify(template);
    
    // Replace date placeholders
    templateStr = templateStr.replace(
      /PLACEHOLDER_DATE/g,
      format(endDate, 'MMMM d, yyyy')
    );
    
    templateStr = templateStr.replace(
      /PLACEHOLDER_DATE_MINUS_1/g,
      format(subDays(endDate, 1), 'MMMM d, yyyy')
    );
    
    templateStr = templateStr.replace(
      /PLACEHOLDER_DATE_MINUS_3/g,
      format(subDays(endDate, 3), 'MMMM d, yyyy')
    );
    
    templateStr = templateStr.replace(
      /PLACEHOLDER_DATE_PLUS_5/g,
      format(addDays(endDate, 5), 'MMM d')
    );
    
    templateStr = templateStr.replace(
      /PLACEHOLDER_DATE_PLUS_7/g,
      format(addDays(endDate, 7), 'MMM d')
    );
    
    templateStr = templateStr.replace(
      /PLACEHOLDER_DATE_PLUS_9/g,
      format(addDays(endDate, 9), 'MMM d')
    );
    
    return JSON.parse(templateStr);
  }

  private static async formatReport(
    data: ReportData,
    reportType: ReportType,
    outputFormat: OutputFormat
  ): Promise<{ content: string | Blob; mimeType: string }> {
    switch (outputFormat) {
      case 'pdf':
        const pdfBlob = await PDFFormatter.formatToPDF(data, reportType);
        return { content: pdfBlob, mimeType: 'application/pdf' };
      
      case 'csv':
        const csvContent = CSVFormatter.formatToCSV(data, reportType);
        return { content: csvContent, mimeType: 'text/csv' };
      
      case 'json':
        const jsonContent = JSONFormatter.formatToJSON(data);
        return { content: jsonContent, mimeType: 'application/json' };
      
      default:
        throw new Error(`Unsupported output format: ${outputFormat}`);
    }
  }

  private static generateFilename(reportType: ReportType, outputFormat: OutputFormat): string {
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    const reportName = reportType.replace('_', '-');
    return `${reportName}-report-${timestamp}.${outputFormat}`;
  }

  static downloadFile(content: string | Blob, filename: string, mimeType: string): void {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}