
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Upload, 
  FolderOpen, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  ArrowRight,
  Activity,
  AlertTriangle,
  Users,
  Building
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

interface MainDashboardProps {
  onNavigate: (view: string) => void;
}

export const MainDashboard = ({ onNavigate }: MainDashboardProps) => {
  const { profile } = useProfile();

  const recentProjects = [
    {
      name: "Downtown Office Complex",
      status: "In Progress",
      progress: 75,
      dueDate: "2024-02-15",
      owner: "Sarah Chen",
      type: "Commercial"
    },
    {
      name: "Residential Tower A",
      status: "Review",
      progress: 90,
      dueDate: "2024-02-20",
      owner: "Mike Johnson",
      type: "Residential"
    },
    {
      name: "Bridge Infrastructure",
      status: "FEA Analysis",
      progress: 45,
      dueDate: "2024-02-25",
      owner: "Alex Kumar",
      type: "Infrastructure"
    }
  ];

  const stats = [
    { label: "Active Projects", value: "12", change: "+3", icon: FolderOpen },
    { label: "Completed This Month", value: "8", change: "+2", icon: CheckCircle },
    { label: "Team Members", value: "24", change: "+1", icon: Users },
    { label: "Avg. Processing Time", value: "2.3h", change: "-0.5h", icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="glass-effect rounded-xl p-8 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              Manage your digital twin projects and collaborate with your team
            </p>
            <div className="flex space-x-4">
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => onNavigate('upload')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Blueprint
              </Button>
              <Button 
                variant="outline" 
                className="border-border hover:bg-secondary/20"
                onClick={() => onNavigate('projects')}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center">
              <Building className="h-16 w-16 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="glass-effect hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <stat.icon className="h-4 w-4 mr-2" />
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.change}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <Card className="lg:col-span-2 glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-foreground">
              Recent Projects
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onNavigate('projects')}
              >
                View All
              </Button>
            </CardTitle>
            <CardDescription>
              Your latest project activities and status updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentProjects.map((project, index) => (
              <div key={index} className="p-4 rounded-lg bg-background/50 border border-border hover-lift cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-foreground">{project.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                      <Badge variant="outline" className="border-border text-foreground">
                        {project.status}
                      </Badge>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Due {project.dueDate}
                      </span>
                      <span>{project.owner}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-foreground font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions & System Status */}
        <div className="space-y-6">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 border-border hover:bg-secondary/20"
                onClick={() => onNavigate('upload')}
              >
                <Upload className="h-5 w-5 mr-3" />
                Upload Blueprint
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 border-border hover:bg-secondary/20"
                onClick={() => onNavigate('team')}
              >
                <Users className="h-5 w-5 mr-3" />
                Invite Team Member
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start h-12 border-border hover:bg-secondary/20"
                onClick={() => onNavigate('analytics')}
              >
                <Activity className="h-5 w-5 mr-3" />
                View Analytics
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="text-foreground">System Status</CardTitle>
              <CardDescription>
                Platform health and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-foreground">FEA Engine</span>
                </div>
                <span className="text-xs text-muted-foreground">2.3s avg</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-foreground">AI Parser</span>
                </div>
                <span className="text-xs text-muted-foreground">1.7min avg</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-foreground">Render Engine</span>
                </div>
                <span className="text-xs text-muted-foreground">5.1s avg</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
