
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/providers/AuthProvider";
import { AuthManager } from "@/components/AuthManager";
import { MainDashboard } from "@/components/dashboard/MainDashboard";
import { ProjectsPage } from "@/components/projects/ProjectsPage";
import { UploadPage } from "@/components/upload/UploadPage";
import { CollaborationPanel } from "@/components/collaboration/CollaborationPanel";
import { EnhancedAIAssistant } from "@/components/ai/EnhancedAIAssistant";
import { AIServicePanel } from "@/components/ai/AIServicePanel";
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
  const [activeTab, setActiveTab] = useState("dashboard");

  if (!user) {
    return <AuthManager />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Collaboration
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <MainDashboard />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsPage />
          </TabsContent>

          <TabsContent value="upload">
            <UploadPage />
          </TabsContent>

          <TabsContent value="collaboration">
            <CollaborationPanel />
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
                  <Button asChild className="w-full">
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
                  <Button asChild variant="outline" className="w-full">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
