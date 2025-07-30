import { ComplianceReportData, ActivityReportData, FEAAnalysisReportData } from '@/types/reports';

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

export const feaAnalysisReportTemplate: FEAAnalysisReportData = {
  projectName: "Sunrise Villa",
  dateGenerated: "PLACEHOLDER_DATE",
  objective: "Validate model against expected residential load limits using finite element analysis (FEA).",
  model: "3D model generated from DXF",
  meshResolution: "35,000 tetrahedral elements",
  boundaryConditions: "Fixed at base slab, distributed load on roof",
  loadCases: [
    { type: "Dead Load", displacement: "2.1 mm", stress: "42 MPa", status: "Passed" },
    { type: "Live Load", displacement: "3.8 mm", stress: "61 MPa", status: "Passed" },
    { type: "Wind Load (E-W)", displacement: "7.2 mm", stress: "78 MPa", status: "Near Limit" },
    { type: "Seismic Load (Z)", displacement: "5.5 mm", stress: "88 MPa", status: "Passed" }
  ],
  recommendations: [
    "Increase roof truss stiffness (current: timber W-beam)",
    "Add lateral bracing to resist hurricane wind uplift"
  ]
};