
import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { ProjectViewer } from "@/components/project/ProjectViewer";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { LandingPage } from "@/components/landing/LandingPage";

const Index = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState<"engineer" | "planner" | "industrial">("engineer");

  // Show a simple loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  // Show landing page if not authenticated
  if (!user) {
    return <LandingPage />;
  }

  // Show main app if authenticated
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Header 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        currentView={currentView}
        setCurrentView={setCurrentView}
        userRole={userRole}
      />
      
      <div className="flex pt-16">
        <Sidebar 
          isOpen={sidebarOpen}
          currentView={currentView}
          setCurrentView={setCurrentView}
          userRole={userRole}
          setUserRole={setUserRole}
        />
        
        <main className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          sidebarOpen ? "ml-64" : "ml-16"
        )}>
          <div className="p-6">
            {currentView === "dashboard" && <Dashboard userRole={userRole} />}
            {currentView === "projects" && <ProjectViewer userRole={userRole} />}
            {currentView === "3d-viewer" && <ProjectViewer userRole={userRole} activeTab="3d" />}
            {currentView === "compliance" && <ProjectViewer userRole={userRole} activeTab="compliance" />}
            {currentView === "gis" && <ProjectViewer userRole={userRole} activeTab="gis" />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
