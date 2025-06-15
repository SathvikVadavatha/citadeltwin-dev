
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface CTASectionProps {
  setShowLogin: (isLogin: boolean) => void;
}

export const CTASection = ({ setShowLogin }: CTASectionProps) => {
  return (
    <section id="cta" className="py-20 warm-gradient">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
          Ready to Transform Your Engineering Workflow?
        </h2>
        <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
          Join thousands of civil engineers who are revolutionizing their projects with CitadelTwin's 
          intelligent digital twin platform.
        </p>
        <Button 
          size="lg" 
          className="bg-white text-gray-800 hover:bg-gray-100"
          onClick={() => setShowLogin(false)}
        >
          Create Your First Digital Twin <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
};
