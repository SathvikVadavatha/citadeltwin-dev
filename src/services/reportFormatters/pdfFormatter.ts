import { ReportData, ComplianceReportData, ActivityReportData, FEAAnalysisReportData } from '@/types/reports';

export class PDFFormatter {
  static async formatToPDF(data: ReportData, reportType: string): Promise<Blob> {
    const htmlContent = this.generateHTML(data, reportType);
    
    // Create a simple PDF-like content (in a real implementation, you'd use a library like jsPDF or html2pdf)
    const pdfContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${reportType.toUpperCase()} Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            h1 { color: #2563eb; border-bottom: 2px solid #2563eb; }
            h2 { color: #1e40af; margin-top: 30px; }
            .status-yes { color: #059669; font-weight: bold; }
            .status-no { color: #dc2626; font-weight: bold; }
            .status-partial { color: #d97706; font-weight: bold; }
            .status-passed { color: #059669; font-weight: bold; }
            .status-near-limit { color: #d97706; font-weight: bold; }
            .status-failed { color: #dc2626; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; }
            ul { margin: 10px 0; padding-left: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .date { color: #6b7280; font-style: italic; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;

    return new Blob([pdfContent], { type: 'text/html' });
  }

  private static generateHTML(data: ReportData, reportType: string): string {
    switch (reportType) {
      case 'compliance':
        return this.generateComplianceHTML(data as ComplianceReportData);
      case 'activity':
        return this.generateActivityHTML(data as ActivityReportData);
      case 'fea_analysis':
        return this.generateFEAHTML(data as FEAAnalysisReportData);
      default:
        return '<h1>Unknown Report Type</h1>';
    }
  }

  private static generateComplianceHTML(data: ComplianceReportData): string {
    return `
      <div class="header">
        <h1>Compliance Report – ${data.projectName}</h1>
        <p class="date">Date Generated: ${data.dateGenerated}</p>
      </div>

      <h2>Building Details</h2>
      <ul>
        <li><strong>Project Name:</strong> ${data.projectName}</li>
        <li><strong>Address:</strong> ${data.address}</li>
        <li><strong>Building Type:</strong> ${data.buildingType}</li>
        <li><strong>Model Version:</strong> ${data.modelVersion}</li>
        <li><strong>Jurisdiction:</strong> ${data.jurisdiction}</li>
      </ul>

      <h2>Compliance Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Standard</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${data.complianceSummary.map(item => `
            <tr>
              <td>${item.category}</td>
              <td>${item.standard}</td>
              <td class="status-${item.status.toLowerCase()}">${item.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>Action Items</h2>
      <ul>
        ${data.actionItems.map(item => `<li>${item}</li>`).join('')}
      </ul>

      <h2>Version History</h2>
      <ul>
        ${data.versionHistory.map(item => `
          <li><strong>${item.version}</strong> – ${item.description} (${item.date})</li>
        `).join('')}
      </ul>
    `;
  }

  private static generateActivityHTML(data: ActivityReportData): string {
    return `
      <div class="header">
        <h1>Activity Report – ${data.projectName}</h1>
        <p class="date">Date Generated: ${data.dateGenerated}</p>
      </div>

      <h2>Team Activity Summary</h2>
      <ul>
        ${data.teamActivity.map(member => `
          <li><strong>${member.name} (${member.role}):</strong> ${member.tasksCompleted} tasks completed – ${member.description}</li>
        `).join('')}
      </ul>

      <h2>System Activity</h2>
      <ul>
        <li>${data.systemActivity.blueprintUploads} blueprint uploads</li>
        <li>${data.systemActivity.modelsGenerated} 3D models generated (${data.systemActivity.modelsApproved} approved, ${data.systemActivity.modelsInReview} in review)</li>
        <li>${data.systemActivity.complianceReports} compliance reports run</li>
        <li><strong>GIS Layers:</strong> ${data.systemActivity.gisLayers.join(', ')}</li>
      </ul>

      <h2>Notifications</h2>
      <ul>
        ${data.notifications.map(notification => `<li>${notification}</li>`).join('')}
      </ul>

      <h2>Next Milestones</h2>
      <ul>
        ${data.nextMilestones.map(milestone => `
          <li><strong>${milestone.task}</strong> – ETA: ${milestone.eta}</li>
        `).join('')}
      </ul>
    `;
  }

  private static generateFEAHTML(data: FEAAnalysisReportData): string {
    return `
      <div class="header">
        <h1>Analysis Report – ${data.projectName}</h1>
        <p class="date">Date Generated: ${data.dateGenerated}</p>
      </div>

      <h2>Overview</h2>
      <ul>
        <li><strong>Objective:</strong> ${data.objective}</li>
        <li><strong>Model:</strong> ${data.model}</li>
        <li><strong>Mesh Resolution:</strong> ${data.meshResolution}</li>
        <li><strong>Boundary Conditions:</strong> ${data.boundaryConditions}</li>
      </ul>

      <h2>Key Load Cases</h2>
      <table>
        <thead>
          <tr>
            <th>Load Type</th>
            <th>Displacement</th>
            <th>Stress</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${data.loadCases.map(loadCase => `
            <tr>
              <td>${loadCase.type}</td>
              <td>${loadCase.displacement}</td>
              <td>${loadCase.stress}</td>
              <td class="status-${loadCase.status.toLowerCase().replace(' ', '-')}">${loadCase.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>Recommendations</h2>
      <ul>
        ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
      </ul>
    `;
  }
}