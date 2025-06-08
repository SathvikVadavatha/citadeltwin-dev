
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  MapPin, 
  Calendar,
  User,
  FileText,
  Box,
  Map,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";

interface ProjectDetailsPageProps {
  onNavigate: (view: string) => void;
  projectId?: string;
}

export const ProjectDetailsPage = ({ onNavigate }: ProjectDetailsPageProps) => {
  const [currentTab, setCurrentTab] = useState("overview");

  const project = {
    name: "Downtown Office Complex",
    status: "In Progress",
    uploadDate: "2024-01-15",
    owner: "Sarah Chen",
    description: "Modern 25-story office building with sustainable design features and LEED certification requirements.",
    location: "Seattle, WA",
    progress: 75,
    type: "Commercial"
  };

  const statusSteps = [
    { label: "Upload", status: "completed", date: "2024-01-15" },
    { label: "Parse", status: "completed", date: "2024-01-16" },
    { label: "Analyze", status: "current", date: "2024-01-18" },
    { label: "Review", status: "pending", date: "" },
    { label: "Approve", status: "pending", date: "" }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "current": return <Clock className="h-5 w-5 text-primary" />;
      default: return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onNavigate('projects')}
            className="hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <Badge className="bg-primary/10 text-primary border-primary/20">
                {project.status}
              </Badge>
              <div className="flex items-center text-muted-foreground text-sm">
                <Calendar className="h-4 w-4 mr-1" />
                Uploaded {project.uploadDate}
              </div>
              <div className="flex items-center text-muted-foreground text-sm">
                <User className="h-4 w-4 mr-1" />
                {project.owner}
              </div>
              <div className="flex items-center text-muted-foreground text-sm">
                <MapPin className="h-4 w-4 mr-1" />
                {project.location}
              </div>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="border-border hover:bg-secondary">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="text-lg">Project Progress</CardTitle>
          <CardDescription>Current status and timeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-3" />
            
            <div className="grid grid-cols-5 gap-4 mt-6">
              {statusSteps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-2">
                    {getStatusIcon(step.status)}
                  </div>
                  <div className="text-sm font-medium text-foreground">{step.label}</div>
                  {step.date && (
                    <div className="text-xs text-muted-foreground mt-1">{step.date}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-5 bg-muted">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="blueprint">Blueprint</TabsTrigger>
          <TabsTrigger value="3d-model">3D Model</TabsTrigger>
          <TabsTrigger value="gis">GIS/Map</TabsTrigger>
          <TabsTrigger value="permits">Permits</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 card-shadow">
              <CardHeader>
                <CardTitle>Project Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{project.description}</p>
                
                <div className="mt-6 space-y-4">
                  <h4 className="font-semibold">Key Milestones</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span>Foundation Complete</span>
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                        Completed
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span>Structural Framework</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                        In Progress
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span>MEP Installation</span>
                      <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                        Pending
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Project Type</label>
                  <p className="text-foreground">{project.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p className="text-foreground">{project.location}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Project Owner</label>
                  <p className="text-foreground">{project.owner}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Upload Date</label>
                  <p className="text-foreground">{project.uploadDate}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge className="bg-primary/10 text-primary border-primary/20 mt-1">
                    {project.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="blueprint">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Blueprint Viewer
              </CardTitle>
              <CardDescription>View and analyze uploaded blueprints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Blueprint viewer will be loaded here</p>
                  <Button variant="outline" className="mt-4">
                    Load Blueprint
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="3d-model">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Box className="h-5 w-5 mr-2" />
                3D Model View
              </CardTitle>
              <CardDescription>Interactive 3D model generated from blueprints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Box className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">3D model viewer will be loaded here</p>
                  <Button variant="outline" className="mt-4">
                    Generate 3D Model
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gis">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Map className="h-5 w-5 mr-2" />
                GIS/Map Integration
              </CardTitle>
              <CardDescription>Project location and geographical context</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Map className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Interactive map will be loaded here</p>
                  <Button variant="outline" className="mt-4">
                    Load Map
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permits">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Permit Documentation</CardTitle>
              <CardDescription>Downloadable permit-ready files and documentation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Building Permit Application</p>
                      <p className="text-sm text-muted-foreground">Generated on 2024-01-20</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Structural Analysis Report</p>
                      <p className="text-sm text-muted-foreground">Generated on 2024-01-18</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Compliance Checklist</p>
                      <p className="text-sm text-muted-foreground">Generated on 2024-01-17</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
