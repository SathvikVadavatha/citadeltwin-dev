
import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { AuthManager } from "@/components/AuthManager";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MainDashboard } from "@/components/dashboard/MainDashboard";
import { ProjectsPage } from "@/components/projects/ProjectsPage";
import { ProjectDetailsPage } from "@/components/projects/ProjectDetailsPage";
import { BlueprintUploadPage } from "@/components/upload/BlueprintUploadPage";

const Index = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<string>();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show auth flow if not authenticated
  if (!user) {
    return <AuthManager />;
  }

  // Show main app if authenticated
  const handleNavigate = (view: string, projectId?: string) => {
    setCurrentView(view);
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  };

  const renderMainContent = () => {
    switch (currentView) {
      case "dashboard":
        return <MainDashboard onNavigate={handleNavigate} />;
      case "projects":
        return <ProjectsPage onNavigate={handleNavigate} />;
      case "project-details":
        return <ProjectDetailsPage onNavigate={handleNavigate} projectId={selectedProjectId} />;
      case "upload":
        return <BlueprintUploadPage onNavigate={handleNavigate} />;
      case "team":
        return <div className="text-foreground">Team Management - Coming Soon</div>;
      case "analytics":
        return <div className="text-foreground">Analytics - Coming Soon</div>;
      case "settings":
        return <div className="text-foreground">Settings - Coming Soon</div>;
      case "help":
        return <div className="text-foreground">Help & Support - Coming Soon</div>;
      default:
        return <MainDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar currentView={currentView} onNavigate={handleNavigate} />
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {renderMainContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;
