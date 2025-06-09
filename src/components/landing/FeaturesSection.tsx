
import { Badge } from "@/components/ui/badge";
import { 
  Upload,
  Building2,
  Zap,
  Map,
  Code2,
  FileText,
  Shield,
  Users
} from "lucide-react";
import { FeatureCard } from "./FeatureCard";

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-card">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-secondary text-secondary-foreground">Core Platform Features</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Everything You Need for Modern Civil Engineering
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            From blueprint upload to permit generation, our platform streamlines your entire workflow 
            with AI-powered insights and real-time collaboration tools.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Upload className="h-8 w-8 text-primary" />}
            title="Smart Blueprint Uploader"
            description="Upload and parse PDF, DWG, DXF, and IFC files with intelligent recognition of structural elements and dimensions."
          />
          <FeatureCard 
            icon={<Building2 className="h-8 w-8 text-primary" />}
            title="3D Model Builder"
            description="Auto-generate interactive 3D models from your blueprints with labeled elements and parametric controls."
          />
          <FeatureCard 
            icon={<Zap className="h-8 w-8 text-primary" />}
            title="Real-time FEA Feedback"
            description="Perform Finite Element Analysis with instant feedback on structural integrity and load distribution."
          />
          <FeatureCard 
            icon={<Map className="h-8 w-8 text-primary" />}
            title="GIS + Zoning Overlay"
            description="Integrate site-specific GIS data and overlay zoning laws for comprehensive spatial analysis."
          />
          <FeatureCard 
            icon={<Code2 className="h-8 w-8 text-primary" />}
            title="Code Compliance Engine"
            description="Automatic compliance checking against building codes with dynamic reporting and recommendations."
          />
          <FeatureCard 
            icon={<FileText className="h-8 w-8 text-primary" />}
            title="Permit Package Export"
            description="Generate comprehensive permit documents with one click — PDF, DOCX, and ZIP formats supported."
          />
          <FeatureCard 
            icon={<Shield className="h-8 w-8 text-primary" />}
            title="Secure Login & Role Access"
            description="Enterprise-grade authentication with role-based access control and team collaboration features."
          />
          <FeatureCard 
            icon={<Users className="h-8 w-8 text-primary" />}
            title="Team Collaboration"
            description="In-app comments, version tracking, and real-time collaboration tools for seamless teamwork."
          />
        </div>
      </div>
    </section>
  );
};
