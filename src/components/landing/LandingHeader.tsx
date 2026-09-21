
import { Button } from "@/components/ui/button";

interface LandingHeaderProps {
  setShowLogin: (isLogin: boolean) => void;
  scrollToSection: (sectionId: string) => void;
}

export const LandingHeader = ({ setShowLogin, scrollToSection }: LandingHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img src={"/citadeltwin-logo.png"} alt="CitadelTwin" className="h-[72px] w-auto max-w-[15rem] object-contain" />
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <button 
            onClick={() => scrollToSection('hero')}
            className="text-foreground hover:text-primary transition-colors"
          >
            Home
          </button>
          <button 
            onClick={() => scrollToSection('features')}
            className="text-foreground hover:text-primary transition-colors"
          >
            Features
          </button>
          <button 
            onClick={() => scrollToSection('explore')}
            className="text-foreground hover:text-primary transition-colors"
          >
            Explore
          </button>
        </nav>

        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-foreground hover:bg-secondary/20"
            onClick={() => setShowLogin(true)}
          >
            Log In
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => setShowLogin(false)}
          >
            Sign Up
          </Button>
        </div>
      </div>
    </header>
  );
};
