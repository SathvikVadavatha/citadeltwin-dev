import jsPDF from 'jspdf';
import { ReportData, ComplianceReportData, ActivityReportData } from '@/types/reports';

export class PDFFormatter {
  static async formatToPDF(data: ReportData, reportType: string): Promise<Blob> {
    const pdf = new jsPDF();
    
    // Set font
    pdf.setFont('helvetica');
    
    switch (reportType) {
      case 'compliance':
        this.generateCompliancePDF(pdf, data as ComplianceReportData);
        break;
      case 'activity':
        this.generateActivityPDF(pdf, data as ActivityReportData);
        break;
      default:
        pdf.text('Unknown Report Type', 20, 20);
    }
    
    return pdf.output('blob');
  }

  private static generateCompliancePDF(pdf: jsPDF, data: ComplianceReportData): void {
    let yPosition = 20;
    
    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Compliance Report – ${data.projectName}`, 20, yPosition);
    yPosition += 15;
    
    // Date
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`Date Generated: ${data.dateGenerated}`, 20, yPosition);
    yPosition += 20;
    
    // Building Details
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Building Details', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const buildingDetails = [
      `Project Name: ${data.projectName}`,
      `Address: ${data.address}`,
      `Building Type: ${data.buildingType}`,
      `Model Version: ${data.modelVersion}`,
      `Jurisdiction: ${data.jurisdiction}`
    ];
    
    buildingDetails.forEach(detail => {
      pdf.text(detail, 25, yPosition);
      yPosition += 8;
    });
    yPosition += 10;
    
    // Compliance Summary
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Compliance Summary', 20, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    data.complianceSummary.forEach(item => {
      const statusColor = item.status === 'Yes' ? [0, 150, 0] : 
                         item.status === 'No' ? [200, 0, 0] : [200, 150, 0];
      
      pdf.text(`• ${item.category}`, 25, yPosition);
      if (item.standard) {
        pdf.text(`(${item.standard})`, 25, yPosition + 6);
      }
      pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      pdf.text(`${item.status}`, 150, yPosition);
      pdf.setTextColor(0, 0, 0);
      yPosition += item.standard ? 18 : 12;
    });
    yPosition += 10;
    
    // Action Items
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Action Items', 20, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    data.actionItems.forEach((item, index) => {
      const lines = pdf.splitTextToSize(`${index + 1}. ${item}`, 170);
      lines.forEach((line: string) => {
        pdf.text(line, 25, yPosition);
        yPosition += 8;
      });
      yPosition += 5;
    });
    yPosition += 10;
    
    // Version History
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Version History', 20, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    data.versionHistory.forEach(item => {
      pdf.text(`• ${item.version} – ${item.description} (${item.date})`, 25, yPosition);
      yPosition += 12;
    });
  }

  private static generateActivityPDF(pdf: jsPDF, data: ActivityReportData): void {
    let yPosition = 20;
    
    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Activity Report – ${data.projectName}`, 20, yPosition);
    yPosition += 15;
    
    // Date
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`Date Generated: ${data.dateGenerated}`, 20, yPosition);
    yPosition += 20;
    
    // Team Activity Summary
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Team Activity Summary', 20, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    data.teamActivity.forEach(member => {
      const memberText = `• ${member.name} (${member.role}): ${member.tasksCompleted} tasks completed – ${member.description}`;
      const lines = pdf.splitTextToSize(memberText, 170);
      lines.forEach((line: string) => {
        pdf.text(line, 25, yPosition);
        yPosition += 8;
      });
      yPosition += 5;
    });
    yPosition += 10;
    
    // System Activity
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('System Activity', 20, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const systemStats = [
      `• ${data.systemActivity.blueprintUploads} blueprint uploads`,
      `• ${data.systemActivity.modelsGenerated} 3D models generated (${data.systemActivity.modelsApproved} approved, ${data.systemActivity.modelsInReview} in review)`,
      `• ${data.systemActivity.complianceReports} compliance reports run`,
      `• GIS Layers: ${data.systemActivity.gisLayers.join(', ')}`
    ];
    
    systemStats.forEach(stat => {
      const lines = pdf.splitTextToSize(stat, 170);
      lines.forEach((line: string) => {
        pdf.text(line, 25, yPosition);
        yPosition += 8;
      });
      yPosition += 3;
    });
    yPosition += 10;
    
    // Check if we need a new page
    if (yPosition > 220) {
      pdf.addPage();
      yPosition = 20;
    }
    
    // Notifications
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Notifications', 20, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    data.notifications.forEach((notification, index) => {
      const notificationText = `${index + 1}. ${notification}`;
      const lines = pdf.splitTextToSize(notificationText, 170);
      lines.forEach((line: string) => {
        pdf.text(line, 25, yPosition);
        yPosition += 8;
      });
      yPosition += 5;
    });
    yPosition += 10;
    
    // Next Milestones
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Next Milestones', 20, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    data.nextMilestones.forEach(milestone => {
      pdf.text(`• ${milestone.task} – ETA: ${milestone.eta}`, 25, yPosition);
      yPosition += 12;
    });
  }

}