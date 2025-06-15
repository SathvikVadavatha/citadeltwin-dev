
import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { AuthManager } from "@/components/AuthManager";
import { LandingPage } from "@/components/landing/LandingPage";
import { CADInterface } from "@/components/cad/CADInterface";
import { ProjectViewer } from "@/components/project/ProjectViewer";
import { UploadPage } from "@/components/upload/UploadPage";
import { ProjectsPage } from "@/components/projects/ProjectsPage";

const Index = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState("projects");
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>();
  const [showAuth, setShowAuth] = useState(false);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show auth flow if not authenticated and auth is requested
  if (!user && showAuth) {
    return <AuthManager />;
  }

  // Show landing page if not authenticated and auth is not requested
  if (!user) {
    return <LandingPage />;
  }

  // Show main interface if authenticated
  const handleNavigate = (view: string, projectId?: string) => {
    setCurrentView(view);
    setCurrentProjectId(projectId);
  };

  const renderMainContent = () => {
    switch (currentView) {
      case "cad":
        return <CADInterface onNavigate={handleNavigate} />;
      case "project":
      case "project-details":
        return <ProjectViewer onNavigate={handleNavigate} />;
      case "upload":
        return <UploadPage onNavigate={handleNavigate} />;
      case "projects":
        return <ProjectsPage onNavigate={handleNavigate} />;
      case "team":
        return <div className="text-foreground p-8">Team Management - Coming Soon</div>;
      case "analytics":
        return <div className="text-foreground p-8">Analytics - Coming Soon</div>;
      case "settings":
        return <div className="text-foreground p-8">Settings - Coming Soon</div>;
      case "help":
        return <div className="text-foreground p-8">Help & Support - Coming Soon</div>;
      default:
        return <ProjectsPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderMainContent()}
    </div>
  );
};

export default Index;
