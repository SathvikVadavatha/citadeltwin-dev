
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  CheckCircle, 
  ChevronRight, 
  Code2, 
  FileCheck, 
  Globe, 
  LineChart, 
  Lock, 
  ShieldCheck,
  Upload,
  Zap,
  Map,
  FileText,
  Shield,
  Users,
  ExternalLink,
  Mail,
  Phone
} from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const LandingPage = () => {
  const [showLogin, setShowLogin] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="text-primary-foreground h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              CitadelTwin
            </h1>
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

      {/* Hero Section */}
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

      {/* Key Features Section */}
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

      {/* Explore Section */}
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

      {/* Security Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary text-primary-foreground">Enterprise Security</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              Built for Enterprise-Grade Security
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Your engineering data is protected with industry-leading security standards 
              and compliance frameworks trusted by Fortune 500 companies.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <SecurityCard 
              icon={<ShieldCheck className="h-8 w-8 text-primary" />}
              title="SOC 2 Type II Ready"
              description="Comprehensive security controls and audit compliance for enterprise deployment."
            />
            <SecurityCard 
              icon={<Lock className="h-8 w-8 text-primary" />}
              title="SSO & 2FA Support"
              description="Single Sign-On integration with multi-factor authentication for enhanced security."
            />
            <SecurityCard 
              icon={<Shield className="h-8 w-8 text-primary" />}
              title="Supabase Auth"
              description="Built on Supabase's secure authentication infrastructure with end-to-end encryption."
            />
          </div>
        </div>
      </section>

      {/* Call to Action */}
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

      {/* Footer */}
      <footer className="bg-card border-t border-border py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Platform</h3>
              <ul className="space-y-3">
                <li><a href="#features" className="text-muted-foreground hover:text-primary transition-colors">Features</a></li>
                <li><a href="#explore" className="text-muted-foreground hover:text-primary transition-colors">Demo</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Enterprise</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Resources</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">API Reference</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Tutorials</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Case Studies</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Support</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">FAQ</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Help Center</a></li>
                <li>
                  <a href="mailto:support@citadeltwin.com" className="text-muted-foreground hover:text-primary transition-colors flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact
                  </a>
                </li>
                <li>
                  <a href="tel:+1-555-0123" className="text-muted-foreground hover:text-primary transition-colors flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Legal</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Security</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>
          
          <div className="section-divider border-t pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                <Building2 className="text-primary-foreground h-4 w-4" />
              </div>
              <span className="text-xl font-bold text-foreground">CitadelTwin</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} CitadelTwin. All rights reserved. Transforming civil engineering through intelligent digital twins.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string 
}) => {
  return (
    <Card className="border-border hover-lift h-full">
      <CardContent className="p-6">
        <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-3 text-foreground">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
};

const SecurityCard = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string 
}) => {
  return (
    <div className="text-center">
      <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};
