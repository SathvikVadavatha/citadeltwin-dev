
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Upload, 
  Download, 
  Share2, 
  Play, 
  Pause, 
  RotateCcw,
  Layers,
  Ruler,
  CheckCircle,
  AlertTriangle,
  FileText,
  Map,
  Box
} from "lucide-react";

interface ProjectViewerProps {
  userRole: "engineer" | "planner" | "industrial";
  activeTab?: string;
}

export const ProjectViewer = ({ userRole, activeTab = "overview" }: ProjectViewerProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Downtown Residential Complex</h1>
            <div className="flex items-center space-x-4 text-sm text-slate-600">
              <Badge variant="outline">In Progress</Badge>
              <span>Last modified: 2 hours ago</span>
              <span>Version 2.3.1</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-white/50 backdrop-blur-sm">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="3d">3D Viewer</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="gis">GIS</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-white/50 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle>Project Files</CardTitle>
                <CardDescription>
                  Uploaded blueprints and documentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "floor-plan-level1.dwg", type: "CAD", size: "2.4 MB", status: "Processed" },
                    { name: "structural-plans.pdf", type: "PDF", size: "8.7 MB", status: "Processing" },
                    { name: "site-survey.ifc", type: "BIM", size: "15.2 MB", status: "Ready" },
                  ].map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/50 border border-white/20">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-slate-500" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-slate-600">{file.type} • {file.size}</p>
                        </div>
                      </div>
                      <Badge variant={file.status === "Processed" ? "default" : file.status === "Processing" ? "secondary" : "outline"}>
                        {file.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/50 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start"
                  onClick={() => setIsAnalyzing(!isAnalyzing)}
                >
                  {isAnalyzing ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {isAnalyzing ? "Pause Analysis" : "Start FEA Analysis"}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Check Compliance
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Layers className="h-4 w-4 mr-2" />
                  Toggle Layers
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Ruler className="h-4 w-4 mr-2" />
                  Measure Tool
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="3d" className="space-y-6 mt-6">
          <Card className="bg-white/50 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Box className="h-5 w-5 mr-2" />
                3D Model Viewer
              </CardTitle>
              <CardDescription>
                Interactive 3D visualization with real-time FEA feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                <div className="text-white text-center">
                  <Box className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">3D Model Loading...</h3>
                  <p className="text-slate-300">WebGL renderer initializing parametric model</p>
                </div>
                
                {/* Simulated 3D Controls */}
                <div className="absolute top-4 left-4 space-y-2">
                  <Button size="sm" variant="secondary">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="secondary">
                    <Layers className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="secondary">
                    <Ruler className="h-4 w-4" />
                  </Button>
                </div>

                {/* FEA Status */}
                <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-white text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>FEA Analysis: Active</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/50 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Compliance Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "Building Height Limits", status: "Pass", details: "Max: 45ft, Current: 42ft" },
                  { name: "Fire Safety Requirements", status: "Pass", details: "Exit routes compliant" },
                  { name: "Setback Requirements", status: "Warning", details: "Front setback: 8ft (min: 10ft)" },
                  { name: "Parking Requirements", status: "Pass", details: "20 spaces provided (min: 18)" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/50 border border-white/20">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-slate-600">{item.details}</p>
                    </div>
                    <Badge variant={item.status === "Pass" ? "default" : "secondary"}>
                      {item.status === "Pass" ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white/50 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle>Automated Remediation</CardTitle>
                <CardDescription>
                  AI-suggested fixes for compliance issues
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Setback Issue Detected</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Front setback is 2ft short. Recommend moving structure back or requesting variance.
                      </p>
                      <Button size="sm" className="mt-2" variant="outline">
                        Apply Auto-Fix
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gis" className="space-y-6 mt-6">
          <Card className="bg-white/50 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Map className="h-5 w-5 mr-2" />
                GIS Integration
              </CardTitle>
              <CardDescription>
                Metro-scale geographic context and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center relative">
                <div className="text-center">
                  <Map className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                  <h3 className="text-xl font-semibold mb-2">Interactive GIS Map</h3>
                  <p className="text-slate-600">Overlaying project data with municipal layers</p>
                </div>
                
                {/* Layer Controls */}
                <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded-lg p-3 space-y-2">
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" checked className="rounded" />
                    <span>Zoning Districts</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" checked className="rounded" />
                    <span>Utilities</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Flood Zones</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Transportation</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/50 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle>Generate Reports</CardTitle>
                <CardDescription>
                  Professional documentation and permit packages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start h-12">
                  <FileText className="h-5 w-5 mr-3" />
                  Permit Application Package
                </Button>
                <Button variant="outline" className="w-full justify-start h-12">
                  <FileText className="h-5 w-5 mr-3" />
                  Structural Analysis Report
                </Button>
                <Button variant="outline" className="w-full justify-start h-12">
                  <FileText className="h-5 w-5 mr-3" />
                  Compliance Summary
                </Button>
                <Button variant="outline" className="w-full justify-start h-12">
                  <FileText className="h-5 w-5 mr-3" />
                  Cost Estimation
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/50 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle>Recent Exports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "Permit_Package_v2.3.pdf", date: "Today, 2:30 PM", size: "4.2 MB" },
                  { name: "FEA_Analysis_Report.pdf", date: "Yesterday, 4:15 PM", size: "12.8 MB" },
                  { name: "Site_Plan_CAD.dwg", date: "Jan 28, 10:22 AM", size: "1.9 MB" },
                ].map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/50 border border-white/20">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-slate-600">{file.date} • {file.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
