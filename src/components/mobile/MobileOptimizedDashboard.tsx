
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useViewport } from '@/hooks/useViewport';
import { 
  Building2, 
  Upload, 
  Eye, 
  Calculator, 
  Shield, 
  BarChart3,
  Plus,
  ArrowRight,
  Zap
} from 'lucide-react';
import { MobileDashboardCard } from './MobileDashboardCard';

interface MobileOptimizedDashboardProps {
  onNavigate: (view: string) => void;
}

export const MobileOptimizedDashboard: React.FC<MobileOptimizedDashboardProps> = ({ onNavigate }) => {
  const { isMobile, isTouch } = useViewport();

  const quickActions = [
    {
      title: "Upload Blueprint",
      description: "Add new project files",
      icon: Upload,
      action: () => onNavigate('upload'),
      color: "bg-blue-500"
    },
    {
      title: "View Projects",
      description: "Browse existing work",
      icon: Eye,
      action: () => onNavigate('projects'),
      color: "bg-green-500"
    },
    {
      title: "Run Analysis",
      description: "Perform FEA calculations",
      icon: Calculator,
      action: () => onNavigate('ai'),
      color: "bg-purple-500"
    },
    {
      title: "Check Compliance",
      description: "Validate building codes",
      icon: Shield,
      action: () => onNavigate('compliance'),
      color: "bg-orange-500"
    }
  ];

  const recentStats = [
    { label: "Active Projects", value: "12", trend: { value: 8, isPositive: true } },
    { label: "Analyses Complete", value: "45", trend: { value: 12, isPositive: true } },
    { label: "Compliance Checks", value: "23", trend: { value: 5, isPositive: false } },
    { label: "Documents Generated", value: "89", trend: { value: 15, isPositive: true } }
  ];

  return (
    <div className={`space-y-4 ${isMobile ? 'px-4' : 'px-6'}`}>
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className={isMobile ? "text-lg" : "text-xl"}>
                Welcome to CitadelTwin
              </CardTitle>
              <CardDescription>
                Civil Engineering Digital Twin Platform
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary" className="mb-3">
            <Zap className="h-3 w-3 mr-1" />
            Mobile Optimized
          </Badge>
          <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
            Create, analyze, and manage your engineering projects on the go.
          </p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Get started with common tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className={`
                  h-auto p-4 justify-start 
                  ${isTouch ? 'min-h-[56px]' : 'min-h-[48px]'}
                  hover:bg-secondary/20 transition-all duration-200
                `}
                onClick={action.action}
              >
                <div className={`p-2 rounded-lg mr-3 ${action.color}`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Project Overview</h3>
        <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
          {recentStats.map((stat, index) => (
            <MobileDashboardCard
              key={index}
              title={stat.label}
              description=""
              icon={BarChart3}
              value={stat.value}
              trend={stat.trend}
              className="touch-manipulation"
            />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest project updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: "Blueprint uploaded", project: "Warehouse Project", time: "2 hours ago" },
              { action: "FEA analysis completed", project: "Bridge Design", time: "4 hours ago" },
              { action: "Compliance check passed", project: "Office Building", time: "1 day ago" }
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-1.5 bg-primary/10 rounded-full">
                  <Building2 className="h-3 w-3 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.action}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.project}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
