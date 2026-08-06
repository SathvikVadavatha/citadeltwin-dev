import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle,
  Clock,
  ExternalLink,
  Eye,
  FileBox,
  MapPinned,
  MessageSquare,
  Ruler,
  Share2,
  ShieldCheck,
} from "lucide-react";

import { SharedProjectsList } from "./SharedProjectsList";
import { ClientFeedbackManager } from "./ClientFeedbackManager";
import { ProgressTracker } from "./ProgressTracker";
import { NotificationCenter } from "./NotificationCenter";
import { useClientPortal } from "@/hooks/useClientPortal";

const prototypeProject = {
  projectName: "Boston Residential Development",
  clientName: "Sample Client",
  siteAddress: "125 Example Street, Boston, MA",
  buildingType: "Residential",
  buildingSubtype: "Multi-family",
  projectStatus: "Analysis in Progress",
  lastUpdated: "August 6, 2026",

  blueprintName: "ground-floor-plan.pdf",
  blueprintStatus: "Processed",
  roomsDetected: 8,
  totalArea: "2,460 sq ft",
  measurementUnit: "Feet",
  modelStatus: "3D Model Ready",

  floodZone: "Low Risk",
  wetlandStatus: "Not Detected",
  protectedAreaStatus: "Not Detected",
  environmentalRisk: "Low",

  jurisdiction: "Boston, Massachusetts",
  complianceStatus: "Review Required",
  passedChecks: 12,
  warnings: 2,
  pendingRequirements: 3,
};

export const ClientPortalDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("projects");

  const { sharedProjects, feedback, notifications, loading } = useClientPortal();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Client Portal</h1>

            <Badge variant="secondary">Prototype</Badge>
          </div>

          <p className="mt-1 text-muted-foreground">
            View project, blueprint, 3D, GIS, compliance, feedback, and progress information.
          </p>
        </div>

        <Button variant="outline">
          <Bell className="mr-2 h-4 w-4" />
          Notifications
          {notifications.unread > 0 && (
            <Badge variant="destructive" className="ml-2">
              {notifications.unread}
            </Badge>
          )}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-blue-500" />

              <div>
                <div className="text-2xl font-bold">{sharedProjects.length}</div>

                <div className="text-sm text-muted-foreground">Shared Projects</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-green-500" />

              <div>
                <div className="text-2xl font-bold">{feedback.pending}</div>

                <div className="text-sm text-muted-foreground">Pending Feedback</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-purple-500" />

              <div>
                <div className="text-2xl font-bold">{feedback.approved}</div>

                <div className="text-sm text-muted-foreground">Approved Items</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-500" />

              <div>
                <div className="text-2xl font-bold">{feedback.inProgress}</div>

                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Overview */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">{prototypeProject.projectName}</CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                {prototypeProject.clientName} • {prototypeProject.siteAddress}
              </p>
            </div>

            <Badge variant="outline">{prototypeProject.projectStatus}</Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Building Type</p>

              <p className="font-medium">{prototypeProject.buildingType}</p>
            </div>

            <div>
              <p className="text-muted-foreground">Building Subtype</p>

              <p className="font-medium">{prototypeProject.buildingSubtype}</p>
            </div>

            <div>
              <p className="text-muted-foreground">Project Status</p>

              <p className="font-medium">{prototypeProject.projectStatus}</p>
            </div>

            <div>
              <p className="text-muted-foreground">Last Updated</p>

              <p className="font-medium">{prototypeProject.lastUpdated}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Analysis Dashboard */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Blueprint and 3D Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileBox className="h-5 w-5" />
              Blueprint & 3D Analysis
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Blueprint File</p>

                <p className="font-medium">{prototypeProject.blueprintName}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Processing Status</p>

                <Badge variant="secondary">{prototypeProject.blueprintStatus}</Badge>
              </div>

              <div>
                <p className="text-muted-foreground">Rooms Detected</p>

                <p className="font-medium">{prototypeProject.roomsDetected}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Total Area</p>

                <p className="font-medium">{prototypeProject.totalArea}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Measurement Unit</p>

                <p className="font-medium">{prototypeProject.measurementUnit}</p>
              </div>

              <div>
                <p className="text-muted-foreground">3D Model Status</p>

                <Badge variant="outline">{prototypeProject.modelStatus}</Badge>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                View 3D Model
              </Button>

              <Button variant="outline" size="sm">
                View Blueprint Details
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* GIS Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPinned className="h-5 w-5" />
              GIS Analysis
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Flood Zone</p>

                <Badge variant="secondary">{prototypeProject.floodZone}</Badge>
              </div>

              <div>
                <p className="text-muted-foreground">Wetlands</p>

                <p className="font-medium">{prototypeProject.wetlandStatus}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Protected Area</p>

                <p className="font-medium">{prototypeProject.protectedAreaStatus}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Environmental Risk</p>

                <Badge variant="outline">{prototypeProject.environmentalRisk}</Badge>
              </div>
            </div>

            <div className="border-t pt-4">
              <Button variant="outline" size="sm">
                <MapPinned className="mr-2 h-4 w-4" />
                View GIS Details
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5" />
              Compliance Analysis
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Jurisdiction</p>

                <p className="font-medium">{prototypeProject.jurisdiction}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Compliance Status</p>

                <Badge variant="outline">{prototypeProject.complianceStatus}</Badge>
              </div>

              <div>
                <p className="text-muted-foreground">Passed Checks</p>

                <p className="font-medium">{prototypeProject.passedChecks}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Warnings</p>

                <p className="font-medium">{prototypeProject.warnings}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Pending Requirements</p>

                <p className="font-medium">{prototypeProject.pendingRequirements}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Professional Review</p>

                <p className="font-medium">Required</p>
              </div>
            </div>

            <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              Compliance results are preliminary and should be reviewed by a licensed professional.
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5" />
              Alerts & Required Actions
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 rounded-md border p-3">
              <Ruler className="mt-1 h-4 w-4 text-orange-500" />

              <div>
                <p className="text-sm font-medium">Confirm Blueprint Scale</p>

                <p className="text-sm text-muted-foreground">
                  Verify the detected scale before approving the final area.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-md border p-3">
              <ShieldCheck className="mt-1 h-4 w-4 text-orange-500" />

              <div>
                <p className="text-sm font-medium">Compliance Review Pending</p>

                <p className="text-sm text-muted-foreground">Three requirements still need review.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-md border p-3">
              <Building2 className="mt-1 h-4 w-4 text-blue-500" />

              <div>
                <p className="text-sm font-medium">Room Labels Need Confirmation</p>

                <p className="text-sm text-muted-foreground">Two room labels have low detection confidence.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Existing Client Portal Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Shared Projects
          </TabsTrigger>

          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </TabsTrigger>

          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Progress
          </TabsTrigger>

          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <SharedProjectsList projects={sharedProjects} loading={loading} />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <ClientFeedbackManager />
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <ProgressTracker />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationCenter />
        </TabsContent>
      </Tabs>
    </div>
  );
};
