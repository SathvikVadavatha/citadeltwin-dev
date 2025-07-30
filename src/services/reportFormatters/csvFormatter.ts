import { ReportData, ComplianceReportData, ActivityReportData, FEAAnalysisReportData } from '@/types/reports';

export class CSVFormatter {
  static formatToCSV(data: ReportData, reportType: string): string {
    switch (reportType) {
      case 'compliance':
        return this.formatComplianceCSV(data as ComplianceReportData);
      case 'activity':
        return this.formatActivityCSV(data as ActivityReportData);
      case 'fea_analysis':
        return this.formatFEACSV(data as FEAAnalysisReportData);
      default:
        return 'Report Type,Error\nUnknown,Report type not supported';
    }
  }

  private static formatComplianceCSV(data: ComplianceReportData): string {
    let csv = 'Section,Field,Value\n';
    
    // Basic info
    csv += `Basic Info,Project Name,"${data.projectName}"\n`;
    csv += `Basic Info,Address,"${data.address}"\n`;
    csv += `Basic Info,Building Type,"${data.buildingType}"\n`;
    csv += `Basic Info,Model Version,"${data.modelVersion}"\n`;
    csv += `Basic Info,Jurisdiction,"${data.jurisdiction}"\n`;
    csv += `Basic Info,Date Generated,"${data.dateGenerated}"\n`;
    
    // Compliance summary
    csv += '\nCompliance Category,Standard,Status\n';
    data.complianceSummary.forEach(item => {
      csv += `"${item.category}","${item.standard}","${item.status}"\n`;
    });
    
    // Action items
    csv += '\nAction Items\n';
    data.actionItems.forEach((item, index) => {
      csv += `"${index + 1}. ${item}"\n`;
    });
    
    // Version history
    csv += '\nVersion,Description,Date\n';
    data.versionHistory.forEach(item => {
      csv += `"${item.version}","${item.description}","${item.date}"\n`;
    });
    
    return csv;
  }

  private static formatActivityCSV(data: ActivityReportData): string {
    let csv = 'Section,Field,Value\n';
    
    // Basic info
    csv += `Basic Info,Project Name,"${data.projectName}"\n`;
    csv += `Basic Info,Date Generated,"${data.dateGenerated}"\n`;
    
    // Team activity
    csv += '\nTeam Member,Role,Tasks Completed,Description\n';
    data.teamActivity.forEach(member => {
      csv += `"${member.name}","${member.role}","${member.tasksCompleted}","${member.description}"\n`;
    });
    
    // System activity
    csv += '\nSystem Activity,Metric,Value\n';
    csv += `System Activity,Blueprint Uploads,${data.systemActivity.blueprintUploads}\n`;
    csv += `System Activity,Models Generated,${data.systemActivity.modelsGenerated}\n`;
    csv += `System Activity,Models Approved,${data.systemActivity.modelsApproved}\n`;
    csv += `System Activity,Models In Review,${data.systemActivity.modelsInReview}\n`;
    csv += `System Activity,Compliance Reports,${data.systemActivity.complianceReports}\n`;
    csv += `System Activity,GIS Layers,"${data.systemActivity.gisLayers.join(', ')}"\n`;
    
    // Notifications
    csv += '\nNotifications\n';
    data.notifications.forEach((notification, index) => {
      csv += `"${index + 1}. ${notification}"\n`;
    });
    
    // Milestones
    csv += '\nTask,ETA\n';
    data.nextMilestones.forEach(milestone => {
      csv += `"${milestone.task}","${milestone.eta}"\n`;
    });
    
    return csv;
  }

  private static formatFEACSV(data: FEAAnalysisReportData): string {
    let csv = 'Section,Field,Value\n';
    
    // Basic info
    csv += `Basic Info,Project Name,"${data.projectName}"\n`;
    csv += `Basic Info,Date Generated,"${data.dateGenerated}"\n`;
    csv += `Basic Info,Objective,"${data.objective}"\n`;
    csv += `Basic Info,Model,"${data.model}"\n`;
    csv += `Basic Info,Mesh Resolution,"${data.meshResolution}"\n`;
    csv += `Basic Info,Boundary Conditions,"${data.boundaryConditions}"\n`;
    
    // Load cases
    csv += '\nLoad Type,Displacement,Stress,Status\n';
    data.loadCases.forEach(loadCase => {
      csv += `"${loadCase.type}","${loadCase.displacement}","${loadCase.stress}","${loadCase.status}"\n`;
    });
    
    // Recommendations
    csv += '\nRecommendations\n';
    data.recommendations.forEach((rec, index) => {
      csv += `"${index + 1}. ${rec}"\n`;
    });
    
    return csv;
  }
}