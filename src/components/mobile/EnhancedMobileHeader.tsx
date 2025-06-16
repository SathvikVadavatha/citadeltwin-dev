
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Menu, 
  Bell, 
  ArrowLeft, 
  Search,
  MoreVertical 
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useMobileNavigation } from './MobileNavigationProvider';

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
  const { user } = useAuth();
  const { goBack, canGoBack } = useMobileNavigation();

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
            <Building2 className="h-6 w-6 text-primary" />
            <div className="flex flex-col">
              <span className="font-bold text-base leading-none">CitadelTwin</span>
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

          <Avatar className="h-8 w-8 touch-manipulation">
            <AvatarImage src="/placeholder-avatar.jpg" />
            <AvatarFallback className="text-xs">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};
