
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  Upload,
  FileText,
  Shield,
  Users,
  Settings,
  Share2,
  Map,
  Box,
  Landmark,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';

const navigation = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Upload Blueprints', href: '/blueprints/upload', icon: Upload },
  { name: 'Blueprint → 3D', href: '/blueprint-3d', icon: Box },
  { name: 'View Blueprints', href: '/blueprints/view', icon: FileText },
  { name: 'GIS Analysis', href: '/gis', icon: Map },
  { name: 'Compliance', href: '/compliance', icon: Shield },
  { name: 'Site & Federal Requirements', href: '/site-requirements', icon: Landmark },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Client Portal', href: '/client-portal', icon: Share2 },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const AppSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card text-card-foreground">
      <div className="flex h-16 items-center px-6 border-b border-border">
        <Link to="/home" className="flex items-center space-x-2">
          <img src="/logo-transparent.png" alt="CitadelTwin" className="h-8 w-8 object-contain" />
          <span className="text-xl font-bold text-foreground">CitadelTwin</span>
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
      <div className="border-t border-border px-2 py-4">
        {user && (
          <div className="px-2 mb-2 text-xs text-muted-foreground truncate">
            {user.email}
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'group flex w-full items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
            'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
          )}
        >
          <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );
};
