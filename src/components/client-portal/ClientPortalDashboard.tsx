import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Eye, MessageSquare, CheckCircle, Clock, Bell, Share2 } from "lucide-react";
import { SharedProjectsList } from "./SharedProjectsList";
import { ClientFeedbackManager } from "./ClientFeedbackManager";
import { ProgressTracker } from "./ProgressTracker";
import { NotificationCenter } from "./NotificationCenter";
import { useClientPortal } from "@/hooks/useClientPortal";

export const ClientPortalDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("projects");
  const { sharedProjects, feedback, notifications, loading } = useClientPortal();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Client Portal</h1>
          <p className="text-muted-foreground mt-1">View shared projects, provide feedback, and track progress</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            {notifications.unread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {notifications.unread}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Eye className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{sharedProjects.length}</div>
                <div className="text-sm text-muted-foreground">Shared Projects</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{feedback.pending}</div>
                <div className="text-sm text-muted-foreground">Pending Feedback</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{feedback.approved}</div>
                <div className="text-sm text-muted-foreground">Approved Items</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{feedback.inProgress}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Shared Projects
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <SharedProjectsList projects={sharedProjects} loading={loading} />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <ClientFeedbackManager />
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <ProgressTracker />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationCenter />
        </TabsContent>
      </Tabs>
    </div>
  );
};
