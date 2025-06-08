
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Calendar,
  MapPin,
  Users,
  Clock,
  MoreHorizontal
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const projects = [
  {
    id: "1",
    name: "Downtown Office Complex",
    description: "Modern 25-story office building with sustainable design",
    status: "In Progress",
    progress: 75,
    location: "Seattle, WA",
    owner: "Sarah Chen",
    team: ["Sarah Chen", "Mike Johnson", "Alex Kumar"],
    dueDate: "2024-02-15",
    type: "Commercial",
    lastModified: "2 hours ago"
  },
  {
    id: "2",
    name: "Residential Tower A",
    description: "Luxury residential complex with 200 units",
    status: "Review",
    progress: 90,
    location: "Portland, OR",
    owner: "Mike Johnson",
    team: ["Mike Johnson", "Lisa Zhang"],
    dueDate: "2024-02-20",
    type: "Residential",
    lastModified: "5 hours ago"
  },
  {
    id: "3",
    name: "Bridge Infrastructure",
    description: "Cable-stayed bridge spanning 500m",
    status: "FEA Analysis",
    progress: 45,
    location: "Vancouver, BC",
    owner: "Alex Kumar",
    team: ["Alex Kumar", "Tom Wilson", "Sarah Chen"],
    dueDate: "2024-02-25",
    type: "Infrastructure",
    lastModified: "1 day ago"
  },
  {
    id: "4",
    name: "Shopping Mall Renovation",
    description: "Complete renovation of existing shopping center",
    status: "Planning",
    progress: 20,
    location: "San Francisco, CA",
    owner: "Lisa Zhang",
    team: ["Lisa Zhang", "Tom Wilson"],
    dueDate: "2024-03-10",
    type: "Renovation",
    lastModified: "3 days ago"
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "In Progress": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "Review": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "FEA Analysis": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "Planning": return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    case "Completed": return "bg-green-500/10 text-green-400 border-green-500/20";
    default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }
};

interface ProjectsPageProps {
  onNavigate: (view: string, projectId?: string) => void;
}

export const ProjectsPage = ({ onNavigate }: ProjectsPageProps) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || project.status === filterStatus;
    const matchesType = filterType === "all" || project.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor your digital twin projects
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="glass-effect">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-background border-border"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 bg-background border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                  <SelectItem value="FEA Analysis">FEA Analysis</SelectItem>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40 bg-background border-border">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Residential">Residential</SelectItem>
                  <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="Renovation">Renovation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-primary" : "border-border hover:bg-secondary/20"}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-primary" : "border-border hover:bg-secondary/20"}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card 
              key={project.id} 
              className="glass-effect hover-lift cursor-pointer"
              onClick={() => onNavigate('project-details', project.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-foreground">{project.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {project.description}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                  <Badge variant="outline" className="border-border text-muted-foreground">
                    {project.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-foreground font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {project.location}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {project.team.length} team members
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Due {project.dueDate}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Modified {project.lastModified}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-effect">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredProjects.map((project) => (
                <div 
                  key={project.id} 
                  className="p-6 hover:bg-secondary/10 cursor-pointer transition-colors"
                  onClick={() => onNavigate('project-details', project.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                        <Badge variant="outline" className="border-border text-muted-foreground">
                          {project.type}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{project.description}</p>
                      <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {project.location}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {project.team.length} members
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Due {project.dueDate}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {project.lastModified}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">{project.progress}%</div>
                        <Progress value={project.progress} className="w-24 h-2 mt-1" />
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
