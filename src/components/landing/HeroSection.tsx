
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthManager } from "@/components/AuthManager";
import { useState } from "react";

interface HeroSectionProps {
  showLogin: boolean | null;
  setShowLogin: (show: boolean | null) => void;
  scrollToSection: (sectionId: string) => void;
}

export const HeroSection = ({ showLogin, setShowLogin, scrollToSection }: HeroSectionProps) => {
  const [showAuth, setShowAuth] = useState(false);

  if (showAuth) {
    return <AuthManager />;
  }

  return (
    <section id="hero" className="py-20 lg:py-32 warm-gradient-subtle">
      <div className="container mx-auto px-6 flex flex-col lg:flex-row items-center">
        <div className="lg:w-1/2 lg:pr-12 mb-10 lg:mb-0">
          <Badge className="mb-6 bg-primary text-primary-foreground border-none">
            Next-Generation Digital Twin Platform
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6">
            Transform Civil Engineering with 
            <span className="text-primary"> Intelligent Digital Twins</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            CitadelTwin revolutionizes how civil engineers design, analyze, and deliver projects. 
            Upload blueprints, generate interactive 3D models, perform real-time structural analysis, 
            and ensure code compliance — all in one intelligent platform.
          </p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => scrollToSection('cta')}
            >
              Get Started Free <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-primary text-primary hover:bg-primary/10"
              onClick={() => scrollToSection('explore')}
            >
              Explore Platform
            </Button>
          </div>
        </div>
        
        <div className="lg:w-1/2">
          {showLogin !== null && (
            <div className="glass-effect p-8 rounded-lg shadow-xl">
              <LoginForm showLogin={showLogin} setShowLogin={setShowLogin} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
