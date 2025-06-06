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
  ShieldCheck 
} from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const LandingPage = () => {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900">
        <header className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 className="text-white h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-white">
              CitadelTwin
            </h1>
          </div>
        </header>

        <div className="container mx-auto px-6 pt-16 pb-24 flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 lg:pr-12 mb-10 lg:mb-0">
            <Badge className="mb-6 bg-indigo-700 text-white border-none hover:bg-indigo-600">
              Professional Digital Twin Platform
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
              Transform Blueprints into Interactive 3D Models
            </h2>
            <p className="text-lg text-blue-100 mb-8">
              CitadelTwin is the cloud-native platform for civil engineers, municipal planners, and industrial leads to collaborate on projects with AI-powered insights and real-time analysis.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50">
                Get Started <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Watch Demo
              </Button>
            </div>
          </div>
          <div className="lg:w-1/2">
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-lg shadow-xl">
              <LoginForm showLogin={showLogin} setShowLogin={setShowLogin} />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4">Core Features</Badge>
            <h2 className="text-3xl font-bold mb-4 text-slate-800">
              Everything You Need for Digital Twins
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Our platform streamlines the entire process from blueprint ingestion to compliance checking and permit generation.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Code2 className="h-6 w-6 text-blue-600" />}
              title="AI Blueprint Conversion"
              description="Upload CAD, BIM, or PDF plans and automatically convert them into parametric 3D models."
            />
            <FeatureCard 
              icon={<LineChart className="h-6 w-6 text-blue-600" />}
              title="Real-time FEA Feedback"
              description="Edit your structure and receive immediate Finite Element Analysis feedback on structural integrity."
            />
            <FeatureCard 
              icon={<Globe className="h-6 w-6 text-blue-600" />}
              title="GIS Integration"
              description="Seamlessly integrate with metro-scale GIS data for comprehensive spatial context and analysis."
            />
            <FeatureCard 
              icon={<FileCheck className="h-6 w-6 text-blue-600" />}
              title="Automated Compliance"
              description="Ensure your projects meet building codes and zoning regulations with automated compliance checking."
            />
            <FeatureCard 
              icon={<CheckCircle className="h-6 w-6 text-blue-600" />}
              title="Permit Packages"
              description="Generate comprehensive permit application packages with one click for fast approvals."
            />
            <FeatureCard 
              icon={<ShieldCheck className="h-6 w-6 text-blue-600" />}
              title="Enterprise Security"
              description="End-to-end encryption with SOC 2 Type II compliance and OWASP Top Ten adherence."
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl font-bold mb-4 text-slate-800">
              Trusted by Engineering Professionals
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              See what our users are saying about how CitadelTwin is transforming their workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="CitadelTwin cut our residential project turnaround time by 40%. The compliance checking alone is worth the investment."
              name="Jane Doe"
              title="Residential Engineer"
              company="BuildRight Solutions"
            />
            <TestimonialCard 
              quote="The GIS integration has been a game-changer for our city-wide infrastructure planning. We can now visualize impacts in real-time."
              name="Ravi Patel"
              title="Municipal Planner"
              company="Metro Planning Department"
            />
            <TestimonialCard 
              quote="Complex factory expansions used to take months of analysis. CitadelTwin's FEA feedback gives us answers in seconds."
              name="Maria Gonzalez"
              title="Industrial Lead"
              company="Advanced Manufacturing Inc."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Engineering Workflow?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join thousands of engineers and planners who are revolutionizing their projects with CitadelTwin.
          </p>
          <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50">
            Get Started with Your First Project <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-300 hover:text-white">Features</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white">Pricing</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white">Case Studies</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-300 hover:text-white">About</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white">Team</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white">Careers</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white">Press</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-300 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white">Guides</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white">Webinars</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-300 hover:text-white">Privacy</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white">Terms</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white">Security</a></li>
                <li><a href="#" className="text-slate-300 hover:text-white">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <Building2 className="text-white h-4 w-4" />
              </div>
              <span className="text-xl font-bold">CitadelTwin</span>
            </div>
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} CitadelTwin. All rights reserved.
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
    <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="rounded-full bg-blue-50 w-12 h-12 flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2 text-slate-800">{title}</h3>
        <p className="text-slate-600">{description}</p>
      </CardContent>
    </Card>
  );
};

const TestimonialCard = ({ 
  quote, 
  name, 
  title, 
  company 
}: { 
  quote: string; 
  name: string; 
  title: string; 
  company: string 
}) => {
  return (
    <Card className="border-none shadow-md">
      <CardContent className="p-6">
        <div className="mb-4 text-blue-600">
          <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104-6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
          </svg>
        </div>
        <p className="mb-4 text-slate-700">{quote}</p>
        <div className="flex items-center">
          <div className="rounded-full bg-blue-100 w-10 h-10 flex items-center justify-center mr-3">
            <span className="font-semibold text-blue-700">
              {name.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium text-slate-900">{name}</p>
            <p className="text-sm text-slate-500">{title}, {company}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
