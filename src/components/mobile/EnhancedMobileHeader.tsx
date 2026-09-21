
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Menu,
  Bell,
  ArrowLeft,
  Search,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useMobileNavigation } from './MobileNavigationProvider';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EnhancedMobileHeaderProps {
  onMenuToggle: () => void;
  title?: string;
  showBackButton?: boolean;
}

export const EnhancedMobileHeader: React.FC<EnhancedMobileHeaderProps> = ({ 
  onMenuToggle, 
  title,
  showBackButton = false 
}) => {
  const { user, signOut } = useAuth();
  const { goBack, canGoBack } = useMobileNavigation();
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (canGoBack) {
      goBack();
    }
  };

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 flex-1">
          {showBackButton && canGoBack ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="p-2 touch-manipulation"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuToggle}
              className="p-2 touch-manipulation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex items-center gap-2 flex-1">
            <img src={"/citadeltwin-logo.png"} alt="CitadelTwin" className="h-9 w-auto max-w-[8rem] object-contain" />
            <div className="flex flex-col">
              {title && (
                <span className="text-xs text-muted-foreground leading-none mt-0.5">
                  {title}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2 relative touch-manipulation"
          >
            <Search className="h-5 w-5" />
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2 relative touch-manipulation"
          >
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-red-500">
              3
            </Badge>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 touch-manipulation cursor-pointer">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback className="text-xs">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user?.email && (
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  {user.email}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={async () => { await signOut(); navigate('/auth/login', { replace: true }); }}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
