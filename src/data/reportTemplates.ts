import { ComplianceReportData, ActivityReportData } from '@/types/reports';

export const complianceReportTemplate: ComplianceReportData = {
  projectName: "Sunrise Villa",
  address: "1832 SW 13th St, Miami, FL 33145",
  buildingType: "Residential (2-Story)",
  modelVersion: "v1.4",
  jurisdiction: "Miami-Dade County, FL",
  dateGenerated: "PLACEHOLDER_DATE",
  complianceSummary: [
    { category: "Structural Integrity", standard: "IBC 2021", status: "Yes" },
    { category: "Wind Load", standard: "ASCE 7-16", status: "Yes" },
    { category: "Fire Safety", standard: "NFPA 101", status: "Yes" },
    { category: "Accessibility", standard: "ADA 2020", status: "Partial" },
    { category: "Zoning & Setbacks", standard: "", status: "Yes" },
    { category: "Flood Zone Considerations", standard: "", status: "No" }
  ],
  actionItems: [
    "Add compliant exit signage per NFPA 101 §7.10.",
    "Submit elevation certification for flood mitigation."
  ],
  versionHistory: [
    { version: "v1.3", description: "Minor geometry update", date: "PLACEHOLDER_DATE_MINUS_3" },
    { version: "v1.4", description: "Final review with FEA integration", date: "PLACEHOLDER_DATE_MINUS_1" }
  ]
};

export const activityReportTemplate: ActivityReportData = {
  projectName: "Sunrise Villa",
  dateGenerated: "PLACEHOLDER_DATE",
  teamActivity: [
    { name: "Mario R.", role: "FEA Engineer", tasksCompleted: 6, description: "Load analysis done" },
    { name: "Sriharsha K.", role: "AI/ML Lead", tasksCompleted: 4, description: "Trained zoning classifier (92%)" },
    { name: "Jenny M.", role: "UI/UX", tasksCompleted: 3, description: "GIS interface delivered" },
    { name: "Olaniyi A.", role: "Backend", tasksCompleted: 1, description: "Minor API patch" }
  ],
  systemActivity: {
    blueprintUploads: 3,
    modelsGenerated: 3,
    modelsApproved: 2,
    modelsInReview: 1,
    complianceReports: 4,
    gisLayers: ["Flood Zones (FL)", "Soil Type (OH)", "Zoning Map (TX)"]
  },
  notifications: [
    "2 overdue backend API tasks",
    "FEA model wind stress warning – pending client approval"
  ],
  nextMilestones: [
    { task: "GIS-React integration", eta: "PLACEHOLDER_DATE_PLUS_5" },
    { task: "Final structural report", eta: "PLACEHOLDER_DATE_PLUS_7" },
    { task: "Client feedback initiation", eta: "PLACEHOLDER_DATE_PLUS_9" }
  ]
};

