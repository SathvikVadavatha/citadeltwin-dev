
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface CTASectionProps {
  setShowLogin: (show: boolean | null) => void;
}

export const CTASection = ({ setShowLogin }: CTASectionProps) => {
  return (
    <section id="cta" className="py-20 warm-gradient">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary-foreground">
          Ready to Transform Your Engineering Workflow?
        </h2>
        <p className="text-xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
          Join thousands of civil engineers who are revolutionizing their projects with CitadelTwin's 
          intelligent digital twin platform.
        </p>
        <Button 
          size="lg" 
          className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          onClick={() => setShowLogin(false)}
        >
          Create Your First Digital Twin <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
};
