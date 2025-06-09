
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface ExploreSectionProps {
  setShowLogin: (isLogin: boolean) => void;
}

export const ExploreSection = ({ setShowLogin }: ExploreSectionProps) => {
  return (
    <section id="explore" className="py-20 bg-background">
      <div className="container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-6 bg-accent text-accent-foreground">Interactive Demo</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Experience CitadelTwin in Action
          </h2>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            See how our platform transforms traditional civil engineering workflows. 
            Explore live demos of 3D model generation, structural analysis, and compliance checking.
          </p>
          <Button 
            size="lg" 
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => setShowLogin(true)}
          >
            Start Interactive Demo <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
