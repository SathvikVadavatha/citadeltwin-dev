
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Upload, 
  Eye, 
  BarChart3, 
  FileText 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/blueprints/upload', icon: Upload, label: 'Upload' },
  { to: '/blueprints/view', icon: Eye, label: 'View' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/documents', icon: FileText, label: 'Docs' },
];

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40">
      <div className="flex">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 px-1 min-h-[60px] transition-colors",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
