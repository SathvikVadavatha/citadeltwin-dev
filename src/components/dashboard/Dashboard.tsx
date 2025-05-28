
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Upload, 
  Plus,
  ArrowRight,
  Activity,
  BarChart3,
  Users
} from "lucide-react";

interface DashboardProps {
  userRole: "engineer" | "planner" | "industrial";
}

export const Dashboard = ({ userRole }: DashboardProps) => {
  const getPersonalizedContent = () => {
    switch (userRole) {
      case "engineer":
        return {
          greeting: "Welcome back, Jane!",
          subtitle: "Let's streamline your home remodeling projects",
          primaryAction: "Upload Blueprint",
          secondaryAction: "Quick Compliance Check",
          stats: [
            { label: "Active Projects", value: "8", trend: "+2" },
            { label: "Compliance Rate", value: "94%", trend: "+3%" },
            { label: "Avg. Turnaround", value: "2.3 days", trend: "-0.5d" },
          ]
        };
      case "planner":
        return {
          greeting: "Welcome back, Ravi!",
          subtitle: "Manage city-wide infrastructure with precision",
          primaryAction: "New Infrastructure Project",
          secondaryAction: "View GIS Analytics",
          stats: [
            { label: "City Projects", value: "23", trend: "+5" },
            { label: "Budget Utilization", value: "78%", trend: "+12%" },
            { label: "Public Approval", value: "89%", trend: "+7%" },
          ]
        };
      case "industrial":
        return {
          greeting: "Welcome back, Maria!",
          subtitle: "Complex structural analysis made simple",
          primaryAction: "Start FEA Analysis",
          secondaryAction: "Review Safety Reports",
          stats: [
            { label: "Complex Projects", value: "5", trend: "+1" },
            { label: "Safety Score", value: "99.2%", trend: "+0.3%" },
            { label: "Analysis Time", value: "4.2 min", trend: "-1.1m" },
          ]
        };
    }
  };

  const content = getPersonalizedContent();

  const recentProjects = [
    { 
      name: "Downtown Residential Complex", 
      status: "In Progress", 
      progress: 65, 
      dueDate: "2024-02-15",
      type: userRole 
    },
    { 
      name: "Metro Transit Hub", 
      status: "Compliance Review", 
      progress: 80, 
      dueDate: "2024-02-20",
      type: userRole 
    },
    { 
      name: "Industrial Warehouse Expansion", 
      status: "FEA Analysis", 
      progress: 45, 
      dueDate: "2024-02-25",
      type: userRole 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{content.greeting}</h1>
            <p className="text-blue-100 text-lg mb-6">{content.subtitle}</p>
            <div className="flex space-x-4">
              <Button className="bg-white text-blue-600 hover:bg-blue-50">
                <Upload className="h-4 w-4 mr-2" />
                {content.primaryAction}
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white/10">
                {content.secondaryAction}
              </Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Activity className="h-16 w-16 text-white/80" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {content.stats.map((stat, index) => (
          <Card key={index} className="bg-white/50 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stat.value}</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.trend}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Projects & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/50 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Projects
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              Your latest project activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentProjects.map((project, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-white/50 border border-white/20">
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{project.name}</h4>
                  <div className="flex items-center space-x-4 text-sm text-slate-600">
                    <Badge variant="outline">{project.status}</Badge>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Due {project.dueDate}
                    </span>
                  </div>
                  <Progress value={project.progress} className="mt-2 h-2" />
                </div>
                <Button variant="ghost" size="sm">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white/50 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for {userRole === "engineer" ? "residential engineers" : userRole === "planner" ? "municipal planners" : "industrial leads"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start h-12">
              <Upload className="h-5 w-5 mr-3" />
              Upload New Blueprint
            </Button>
            <Button variant="outline" className="w-full justify-start h-12">
              <CheckCircle className="h-5 w-5 mr-3" />
              Run Compliance Check
            </Button>
            <Button variant="outline" className="w-full justify-start h-12">
              <BarChart3 className="h-5 w-5 mr-3" />
              Generate FEA Report
            </Button>
            <Button variant="outline" className="w-full justify-start h-12">
              <Users className="h-5 w-5 mr-3" />
              Invite Collaborators
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="bg-white/50 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Real-time platform health and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-medium">FEA Engine</p>
                <p className="text-xs text-slate-600">Online - 2.3s avg</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-medium">AI Blueprint Parser</p>
                <p className="text-xs text-slate-600">Online - 4.7min avg</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-medium">GIS Services</p>
                <p className="text-xs text-slate-600">Degraded - 8.2s avg</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-medium">Compliance DB</p>
                <p className="text-xs text-slate-600">Online - 1.1s avg</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
