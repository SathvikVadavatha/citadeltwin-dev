
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  FolderOpen, 
  Box, 
  CheckCircle, 
  Map, 
  FileText, 
  Users, 
  Settings,
  Home,
  Building,
  Factory,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  currentView: string;
  setCurrentView: (view: string) => void;
  userRole: "engineer" | "planner" | "industrial";
  setUserRole: (role: "engineer" | "planner" | "industrial") => void;
}

export const Sidebar = ({ isOpen, currentView, setCurrentView, userRole, setUserRole }: SidebarProps) => {
  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null },
    { id: "projects", label: "Projects", icon: FolderOpen, badge: "12" },
    { id: "3d-viewer", label: "3D Viewer", icon: Box, badge: null },
    { id: "compliance", label: "Compliance", icon: CheckCircle, badge: "3" },
    { id: "gis", label: "GIS Integration", icon: Map, badge: null },
    { id: "reports", label: "Reports", icon: FileText, badge: null },
  ];

  const roleItems = [
    { id: "engineer", label: "Residential Engineer", icon: Home, description: "Home remodels & compliance" },
    { id: "planner", label: "Municipal Planner", icon: Building, description: "City infrastructure projects" },
    { id: "industrial", label: "Industrial Lead", icon: Factory, description: "Complex structural analysis" },
  ];

  return (
    <aside className={cn(
      "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-r border-slate-200/50 dark:border-slate-700/50 transition-all duration-300 ease-in-out",
      isOpen ? "w-64" : "w-16"
    )}>
      <ScrollArea className="h-full">
        <div className="p-4">
          {/* Role Switcher */}
          {isOpen && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">
                Switch Role
              </h3>
              <div className="space-y-2">
                {roleItems.map((role) => (
                  <Button
                    key={role.id}
                    variant={userRole === role.id ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start text-left h-auto p-3",
                      userRole === role.id && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                    )}
                    onClick={() => setUserRole(role.id as any)}
                  >
                    <role.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{role.label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {role.description}
                      </div>
                    </div>
                    {userRole === role.id && <ChevronRight className="h-4 w-4 ml-2 flex-shrink-0" />}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Separator className="my-4" />

          {/* Navigation */}
          <nav className="space-y-2">
            {isOpen && (
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">
                Navigation
              </h3>
            )}
            
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={currentView === item.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  !isOpen && "justify-center px-2",
                  currentView === item.id && "bg-blue-50 dark:bg-blue-900/20"
                )}
                onClick={() => setCurrentView(item.id)}
              >
                <item.icon className={cn("h-5 w-5", isOpen && "mr-3")} />
                {isOpen && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-2">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            ))}
          </nav>

          <Separator className="my-4" />

          {/* Additional Tools */}
          <div className="space-y-2">
            {isOpen && (
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">
                Tools
              </h3>
            )}
            
            <Button variant="ghost" className={cn("w-full justify-start", !isOpen && "justify-center px-2")}>
              <Users className={cn("h-5 w-5", isOpen && "mr-3")} />
              {isOpen && "Collaboration"}
            </Button>
            
            <Button variant="ghost" className={cn("w-full justify-start", !isOpen && "justify-center px-2")}>
              <Settings className={cn("h-5 w-5", isOpen && "mr-3")} />
              {isOpen && "Settings"}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
};
