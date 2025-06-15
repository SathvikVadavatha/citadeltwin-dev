
import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { AuthManager } from '@/components/AuthManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CollaborationPanel } from '@/components/collaboration/CollaborationPanel';
import { CollaborativeEditor } from '@/components/collaboration/CollaborativeEditor';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Settings, Edit } from 'lucide-react';

const Collaboration = () => {
  const { user, loading } = useAuth();
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground glow-cyan">Real-time Collaboration</h1>
              <p className="text-muted-foreground mt-2">
                Work together on engineering projects with live editing, cursors, and presence indicators
              </p>
            </div>

            {/* Project Selection */}
            <Card className="gradient-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Select Project</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="cyber-button">
                    <SelectValue placeholder="Choose a project to collaborate on" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {selectedProjectId ? (
            <Tabs defaultValue="collaborate" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-card border border-border">
                <TabsTrigger value="collaborate" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Edit className="w-4 h-4 mr-2" />
                  Live Editor
                </TabsTrigger>
                <TabsTrigger value="manage" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Users className="w-4 h-4 mr-2" />
                  Sessions & Users
                </TabsTrigger>
              </TabsList>

              <TabsContent value="collaborate" className="mt-6">
                <CollaborativeEditor projectId={selectedProjectId} />
              </TabsContent>

              <TabsContent value="manage" className="mt-6">
                <CollaborationPanel projectId={selectedProjectId} />
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="gradient-border">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Project</h3>
                <p className="text-muted-foreground">
                  Choose a project from the dropdown above to start collaborating with your team.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Collaboration;
