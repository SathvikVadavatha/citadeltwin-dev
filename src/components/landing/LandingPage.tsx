
import { useState } from "react";
import { LandingHeader } from "./LandingHeader";
import { HeroSection } from "./HeroSection";
import { FeaturesSection } from "./FeaturesSection";
import { ExploreSection } from "./ExploreSection";
import { SecuritySection } from "./SecuritySection";
import { CTASection } from "./CTASection";
import { LandingFooter } from "./LandingFooter";
import { AuthManager } from "@/components/AuthManager";

export const LandingPage = () => {
  const [showLogin, setShowLogin] = useState<boolean | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  // If auth is requested, show the AuthManager
  if (showAuth) {
    return <AuthManager />;
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleShowAuth = (isLogin: boolean) => {
    setShowLogin(isLogin);
    setShowAuth(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader setShowLogin={handleShowAuth} scrollToSection={scrollToSection} />
      <HeroSection showLogin={showLogin} setShowLogin={setShowLogin} scrollToSection={scrollToSection} />
      <FeaturesSection />
      <ExploreSection setShowLogin={handleShowAuth} />
      <SecuritySection />
      <CTASection setShowLogin={handleShowAuth} />
      <LandingFooter />
    </div>
  );
};
