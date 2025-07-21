
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Building2, 
  LayoutDashboard, 
  Upload, 
  FileText, 
  Shield, 
  BarChart3, 
  Users, 
  Settings,
  TestTube,
  Zap,
  Share2,
  Map
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Upload Blueprints', href: '/blueprints/upload', icon: Upload },
  { name: 'View Blueprints', href: '/blueprints/view', icon: FileText },
  { name: 'GIS Analysis', href: '/gis', icon: Map },
  { name: 'Compliance', href: '/compliance', icon: Shield },
  { name: 'FEA Analysis', href: '/fea-analysis', icon: Zap },
  { name: 'Testing & QA', href: '/testing', icon: TestTube },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Client Portal', href: '/client-portal', icon: Share2 },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const AppSidebar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-background border-r">
      <div className="flex h-16 items-center px-6 border-b">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <Building2 className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">CitadelTwin</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-accent-foreground'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
