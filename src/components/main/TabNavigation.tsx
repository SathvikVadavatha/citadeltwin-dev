
import React from 'react';
import { Button } from '@/components/ui/button';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useViewport } from '@/hooks/useViewport';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Upload, 
  Users, 
  Brain 
} from 'lucide-react';

interface TabItem {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabItems: TabItem[];
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  tabItems
}) => {
  const { isMobile, isTouch } = useViewport();

  if (isMobile && isTouch) {
    return (
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
            onClick={() => onTabChange(item.value)}
          >
            <item.icon className="h-4 w-4 mr-2" />
            <span className="whitespace-nowrap">{item.label}</span>
          </Button>
        ))}
      </div>
    );
  }

  return (
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
  );
};
