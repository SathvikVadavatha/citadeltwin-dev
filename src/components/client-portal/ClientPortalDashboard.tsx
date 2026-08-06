import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileUp,
  MapPinned,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { SharedProjectsList } from "./SharedProjectsList";
import { ClientFeedbackManager } from "./ClientFeedbackManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClientPortal } from "@/hooks/useClientPortal";

type ProjectStatus = "In Progress" | "Ready" | "Approved";

type TrackerProject = {
  id: string;
  projectName: string;
  clientName: string;
  siteAddress: string;
  buildingType: string;
  buildingSubtype: string;
  status: ProjectStatus;
  lastUpdated: string;
  blueprintFile: string;
  dimensions: string;
  units: string;
  roomsDetected: number;
  roomLabels: string[];
  modelStatus: string;
  complianceSummary: string;
  complianceDetails: string[];
  complianceCitation: string;
  floodRisk: string;
  wetlands: string;
  soil: string;
  zoning: string;
  overallRisk: string;
};

const initialProjects: TrackerProject[] = [
  {
    id: "CT-001",
    projectName: "Boston Residential Development",
    clientName: "Sample Client A",
    siteAddress: "125 Example Street, Boston, MA",
    buildingType: "Residential",
    buildingSubtype: "Multi-family",
    status: "Ready",
    lastUpdated: "Aug 6, 2026",
    blueprintFile: "ground-floor-plan.pdf",
    dimensions: "42 ft × 58 ft",
    units: "Feet",
    roomsDetected: 8,
    roomLabels: ["Living Room", "Kitchen", "Bedroom 1", "Bedroom 2"],
    modelStatus: "Model ready for review",
    complianceSummary: "Two items need professional review before approval.",
    complianceDetails: [
      "Confirm required side-yard setback for the selected building subtype.",
      "Verify egress dimensions against the applicable local code.",
    ],
    complianceCitation: "Sample citation placeholder — connect to the saved rule source later.",
    floodRisk: "Low",
    wetlands: "Not detected",
    soil: "Review recommended",
    zoning: "Residential district",
    overallRisk: "Low to moderate",
  },
  {
    id: "CT-002",
    projectName: "Cambridge Retail Fit-Out",
    clientName: "Sample Client B",
    siteAddress: "80 Sample Avenue, Cambridge, MA",
    buildingType: "Commercial",
    buildingSubtype: "Retail",
    status: "In Progress",
    lastUpdated: "Aug 5, 2026",
    blueprintFile: "retail-layout.png",
    dimensions: "Scale validation pending",
    units: "Not confirmed",
    roomsDetected: 5,
    roomLabels: ["Sales Floor", "Storage", "Office"],
    modelStatus: "Processing blueprint",
    complianceSummary: "Compliance and risk checks will appear when processing is complete.",
    complianceDetails: ["No completed compliance findings yet."],
    complianceCitation: "Citation will be shown with each completed result.",
    floodRisk: "Pending",
    wetlands: "Pending",
    soil: "Pending",
    zoning: "Pending",
    overallRisk: "Pending",
  },
  {
    id: "CT-003",
    projectName: "Somerville Office Renovation",
    clientName: "Sample Client C",
    siteAddress: "210 Demo Road, Somerville, MA",
    buildingType: "Commercial",
    buildingSubtype: "Office",
    status: "Approved",
    lastUpdated: "Aug 2, 2026",
    blueprintFile: "office-revision-02.pdf",
    dimensions: "60 ft × 75 ft",
    units: "Feet",
    roomsDetected: 11,
    roomLabels: ["Lobby", "Conference Room", "Open Office", "Break Room"],
    modelStatus: "Approved model",
    complianceSummary: "No unresolved high-priority issues in this prototype result.",
    complianceDetails: ["Accessibility route reviewed.", "Primary exit path reviewed."],
    complianceCitation: "Sample citation placeholder — connect to the saved rule source later.",
    floodRisk: "Low",
    wetlands: "Not detected",
    soil: "No current flag",
    zoning: "Commercial district",
    overallRisk: "Low",
  },
];

const statusBadgeClass: Record<ProjectStatus, string> = {
  "In Progress": "border-orange-200 bg-orange-50 text-orange-700",
  Ready: "border-blue-200 bg-blue-50 text-blue-700",
  Approved: "border-green-200 bg-green-50 text-green-700",
};

export const ClientPortalDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("tracker");
  const [projects, setProjects] = useState<TrackerProject[]>(initialProjects);
  const [selectedProject, setSelectedProject] = useState<TrackerProject | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  const { sharedProjects, loading } = useClientPortal();

  const counts = useMemo(
    () => ({
      total: projects.length,
      inProgress: projects.filter((project) => project.status === "In Progress").length,
      ready: projects.filter((project) => project.status === "Ready").length,
      approved: projects.filter((project) => project.status === "Approved").length,
    }),
    [projects],
  );

  const approveSelectedProject = () => {
    if (!selectedProject) return;

    const approvedProject: TrackerProject = {
      ...selectedProject,
      status: "Approved",
      lastUpdated: "Just now",
    };

    setProjects((currentProjects) =>
      currentProjects.map((project) => (project.id === approvedProject.id ? approvedProject : project)),
    );
    setSelectedProject(approvedProject);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">Client Portal</h1>
            <Badge variant="secondary">UI Prototype</Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            Track every project and open one project to review its model, compliance, and site risk.
          </p>
        </div>

        <Button disabled title="Connect this action after the new-project workflow is approved.">
          <FileUp className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tracker">Project Tracker</TabsTrigger>
          <TabsTrigger value="shared">Shared Projects</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="tracker" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <Clock3 className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{counts.inProgress}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <Eye className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{counts.ready}</p>
                  <p className="text-sm text-muted-foreground">Ready for Review</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{counts.approved}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <Building2 className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{counts.total}</p>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>All Projects</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    One row represents one building project. Open a row to review the complete result.
                  </p>
                </div>
                <Badge variant="outline">Sample data only</Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Building Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id} className="cursor-pointer" onClick={() => setSelectedProject(project)}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{project.projectName}</p>
                          <p className="max-w-[260px] truncate text-xs text-muted-foreground">{project.siteAddress}</p>
                        </div>
                      </TableCell>
                      <TableCell>{project.clientName}</TableCell>
                      <TableCell>
                        <p>{project.buildingType}</p>
                        <p className="text-xs text-muted-foreground">{project.buildingSubtype}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusBadgeClass[project.status]}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{project.lastUpdated}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedProject(project);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Project
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shared" className="space-y-4">
          <SharedProjectsList projects={sharedProjects} loading={loading} />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <ClientFeedbackManager />
        </TabsContent>
      </Tabs>

      <Sheet
        open={Boolean(selectedProject)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProject(null);
            setFeedbackText("");
          }
        }}
      >
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-none lg:w-[92vw]">
          {selectedProject && (
            <div className="mx-auto max-w-7xl space-y-6 pb-8">
              <SheetHeader className="pr-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <SheetTitle className="text-2xl">{selectedProject.projectName}</SheetTitle>
                    <SheetDescription className="mt-1">
                      {selectedProject.clientName} • {selectedProject.siteAddress}
                    </SheetDescription>
                  </div>
                  <Badge variant="outline" className={statusBadgeClass[selectedProject.status]}>
                    {selectedProject.status}
                  </Badge>
                </div>
              </SheetHeader>

              <Card>
                <CardContent className="grid grid-cols-1 gap-4 p-5 text-sm sm:grid-cols-2 xl:grid-cols-5">
                  <div>
                    <p className="text-muted-foreground">Project ID</p>
                    <p className="font-medium">{selectedProject.id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Building Type</p>
                    <p className="font-medium">
                      {selectedProject.buildingType} / {selectedProject.buildingSubtype}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Blueprint</p>
                    <p className="font-medium">{selectedProject.blueprintFile}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Model Status</p>
                    <p className="font-medium">{selectedProject.modelStatus}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{selectedProject.lastUpdated}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        3D Model and Blueprint Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="flex min-h-[340px] items-center justify-center rounded-lg border border-dashed bg-muted/30 p-6 text-center">
                        <div className="max-w-md">
                          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                          <p className="mt-3 font-medium">3D model preview area</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            The saved model viewer will be loaded here after model persistence is connected.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                        <div className="rounded-md border p-3">
                          <p className="text-muted-foreground">Dimensions</p>
                          <p className="mt-1 font-medium">{selectedProject.dimensions}</p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-muted-foreground">Measurement Unit</p>
                          <p className="mt-1 font-medium">{selectedProject.units}</p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-muted-foreground">Rooms Detected</p>
                          <p className="mt-1 font-medium">{selectedProject.roomsDetected}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium">Room labels</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedProject.roomLabels.map((room) => (
                            <Badge key={room} variant="secondary">
                              {room}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Client Feedback
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Textarea
                        value={feedbackText}
                        onChange={(event) => setFeedbackText(event.target.value)}
                        placeholder="Add feedback about the model, room labels, compliance result, or site risk..."
                      />
                      <Button disabled={!feedbackText.trim()}>Save Feedback Locally</Button>
                      <p className="text-xs text-muted-foreground">
                        Prototype behavior only. Connect this field to feedback stored by project ID later.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5" />
                        Compliance Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-md border bg-muted/30 p-4">
                        <p className="text-sm font-medium">Plain-language summary</p>
                        <p className="mt-1 text-sm text-muted-foreground">{selectedProject.complianceSummary}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium">Technical details</p>
                        <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                          {selectedProject.complianceDetails.map((detail) => (
                            <li key={detail} className="flex gap-2">
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-md border p-3 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Source:</span>{" "}
                        {selectedProject.complianceCitation}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPinned className="h-5 w-5" />
                        Site Risk and GIS
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex items-center justify-between rounded-md border p-3">
                        <span className="text-muted-foreground">Overall Risk</span>
                        <Badge variant="outline">{selectedProject.overallRisk}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-md border p-3">
                          <p className="text-muted-foreground">Flood</p>
                          <p className="mt-1 font-medium">{selectedProject.floodRisk}</p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-muted-foreground">Wetlands</p>
                          <p className="mt-1 font-medium">{selectedProject.wetlands}</p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-muted-foreground">Soil</p>
                          <p className="mt-1 font-medium">{selectedProject.soil}</p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-muted-foreground">Zoning</p>
                          <p className="mt-1 font-medium">{selectedProject.zoning}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="sticky bottom-0 rounded-lg border bg-background/95 p-4 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex max-w-3xl items-start gap-2 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    <p>These results are preliminary and are not a substitute for review by a licensed professional.</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" disabled>
                      <FileUp className="mr-2 h-4 w-4" />
                      Re-upload Revision
                    </Button>
                    <Button variant="outline" disabled>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                    <Button onClick={approveSelectedProject} disabled={selectedProject.status === "Approved"}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {selectedProject.status === "Approved" ? "Approved" : "Approve Project"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
