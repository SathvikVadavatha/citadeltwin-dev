
import { useState } from "react";
import { Tabs } from "@/components/ui/tabs";
import { useAuth } from "@/providers/AuthProvider";
import { useViewport } from "@/hooks/useViewport";
import { AuthManager } from "@/components/AuthManager";
import { SwipeableViews } from "@/components/mobile/SwipeableViews";
import { MainHeader } from "@/components/main/MainHeader";
import { TabNavigation } from "@/components/main/TabNavigation";
import { TabContentRenderer } from "@/components/main/TabContentRenderer";
import { 
  LayoutDashboard, 
  FolderOpen, 
  Upload, 
  Users, 
  Brain
} from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const { isMobile, isTouch } = useViewport();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (!user) {
    return <AuthManager />;
  }

  const handleNavigate = (view: string) => {
    setActiveTab(view);
  };

  const tabItems = [
    { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { value: "projects", label: "Projects", icon: FolderOpen },
    { value: "upload", label: "Upload", icon: Upload },
    { value: "collaboration", label: "Collaboration", icon: Users },
    { value: "ai", label: "AI Tools", icon: Brain }
  ];

  const activeTabIndex = tabItems.findIndex(item => item.value === activeTab);

  return (
    <div className="min-h-screen bg-background">
      <div className={`container mx-auto ${isMobile ? 'p-3' : 'p-4'}`}>
        {!isMobile && <MainHeader />}

        {isMobile && isTouch ? (
          <div className="space-y-4">
            <TabNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabItems={tabItems}
            />
            
            <SwipeableViews
              activeIndex={activeTabIndex}
              onIndexChange={(index) => setActiveTab(tabItems[index].value)}
              className="min-h-[60vh]"
            >
              {tabItems.map((_, index) => (
                <div key={index} className="w-full">
                  <TabContentRenderer onNavigate={handleNavigate} />
                </div>
              ))}
            </SwipeableViews>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabItems={tabItems}
            />
            <TabContentRenderer onNavigate={handleNavigate} />
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Index;
