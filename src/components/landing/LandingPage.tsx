
import { useState } from "react";
import { LandingHeader } from "./LandingHeader";
import { HeroSection } from "./HeroSection";
import { FeaturesSection } from "./FeaturesSection";
import { ExploreSection } from "./ExploreSection";
import { SecuritySection } from "./SecuritySection";
import { CTASection } from "./CTASection";
import { LandingFooter } from "./LandingFooter";

export const LandingPage = () => {
  const [showLogin, setShowLogin] = useState<boolean | null>(null);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader setShowLogin={setShowLogin} scrollToSection={scrollToSection} />
      <HeroSection showLogin={showLogin} setShowLogin={setShowLogin} scrollToSection={scrollToSection} />
      <FeaturesSection />
      <ExploreSection setShowLogin={setShowLogin} />
      <SecuritySection />
      <CTASection setShowLogin={setShowLogin} />
      <LandingFooter />
    </div>
  );
};
