
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/providers/AuthProvider";
import { useViewport } from "@/hooks/useViewport";
import { AuthManager } from "@/components/AuthManager";
import { MainDashboard } from "@/components/dashboard/MainDashboard";
import { MobileOptimizedDashboard } from "@/components/mobile/MobileOptimizedDashboard";
import { ProjectsPage } from "@/components/projects/ProjectsPage";
import { UploadPage } from "@/components/upload/UploadPage";
import { CollaborationPanel } from "@/components/collaboration/CollaborationPanel";
import { EnhancedAIAssistant } from "@/components/ai/EnhancedAIAssistant";
import { AIServicePanel } from "@/components/ai/AIServicePanel";
import { SwipeableViews } from "@/components/mobile/SwipeableViews";
import { 
  LayoutDashboard, 
  FolderOpen, 
  Upload, 
  Users, 
  Brain,
  Calculator,
  Zap,
  MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();
  const { isMobile, isTouch } = useViewport();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (!user) {
    return <AuthManager />;
  }

  const handleNavigate = (view: string) => {
    setActiveTab(view);
  };

  const tabItems = [
    { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { value: "projects", label: "Projects", icon: FolderOpen },
    { value: "upload", label: "Upload", icon: Upload },
    { value: "collaboration", label: "Collaboration", icon: Users },
    { value: "ai", label: "AI Tools", icon: Brain }
  ];

  const tabContent = [
    {
      value: "dashboard",
      content: isMobile ? (
        <MobileOptimizedDashboard onNavigate={handleNavigate} />
      ) : (
        <MainDashboard />
      )
    },
    {
      value: "projects",
      content: <ProjectsPage onNavigate={handleNavigate} />
    },
    {
      value: "upload",
      content: <UploadPage onNavigate={handleNavigate} />
    },
    {
      value: "collaboration",
      content: <CollaborationPanel projectId="default-project" />
    },
    {
      value: "ai",
      content: (
        <div className="space-y-6">
          <div className={`grid gap-6 mb-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  AI Chat Assistant
                </CardTitle>
                <CardDescription>
                  Interactive AI assistant for technical consulting and guidance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className={`w-full ${isTouch ? 'min-h-[44px]' : ''}`}>
                  <Link to="/ai-assistant">
                    Open AI Assistant
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Engineering Tools
                </CardTitle>
                <CardDescription>
                  AI-powered calculations and design optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className={`w-full ${isTouch ? 'min-h-[44px]' : ''}`}>
                  <Link to="/ai-assistant?tab=calculator">
                    Open Calculator
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick AI Service</CardTitle>
              <CardDescription>
                Test AI functionality directly from the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AIServicePanel />
            </CardContent>
          </Card>
        </div>
      )
    }
  ];

  const activeTabIndex = tabItems.findIndex(item => item.value === activeTab);

  return (
    <div className="min-h-screen bg-background">
      <div className={`container mx-auto ${isMobile ? 'p-3' : 'p-4'}`}>
        {!isMobile && (
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">CitadelTwin</h1>
                <p className="text-muted-foreground">Civil Engineering Digital Twin Platform</p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link to="/collaboration">
                    <Users className="h-4 w-4 mr-2" />
                    Collaboration
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/ai-assistant">
                    <Brain className="h-4 w-4 mr-2" />
                    AI Assistant
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {isMobile && isTouch ? (
          <div className="space-y-4">
            {/* Mobile Tab Headers */}
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
              {tabItems.map((item) => (
                <Button
                  key={item.value}
                  variant={activeTab === item.value ? "default" : "outline"}
                  size="sm"
                  className={`
                    flex-shrink-0 min-w-0 touch-manipulation
                    ${isTouch ? 'min-h-[44px] px-4' : 'px-3'}
                  `}
                  onClick={() => setActiveTab(item.value)}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Button>
              ))}
            </div>

            {/* Swipeable Content */}
            <SwipeableViews
              activeIndex={activeTabIndex}
              onIndexChange={(index) => setActiveTab(tabItems[index].value)}
              className="min-h-[60vh]"
            >
              {tabContent.map((tab, index) => (
                <div key={index} className="w-full">
                  {tab.content}
                </div>
              ))}
            </SwipeableViews>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={`grid w-full mb-6 ${isMobile ? 'grid-cols-3 h-auto' : 'grid-cols-5'}`}>
              {tabItems.map((item) => (
                <TabsTrigger 
                  key={item.value}
                  value={item.value} 
                  className={`flex items-center gap-2 ${isMobile ? 'flex-col p-3 text-xs' : ''}`}
                >
                  <item.icon className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
                  <span className={isMobile ? "mt-1" : ""}>{item.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {tabContent.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Index;
