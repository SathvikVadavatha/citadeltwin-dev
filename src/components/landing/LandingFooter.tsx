
import { Mail, Phone } from "lucide-react";

export const LandingFooter = () => {
  return (
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
                <a href="mailto:info@cdreams.org" className="text-muted-foreground hover:text-primary transition-colors flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  info@cdreams.org
                </a>
              </li>
              <li>
                <a href="tel:+14072594242" className="text-muted-foreground hover:text-primary transition-colors flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  +1 (407) 259-4242
                </a>
              </li>
              <li className="text-muted-foreground">Tampa, FL</li>
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
              <img src="/logo.png" alt="CitadelTwin" className="h-4 w-4 object-contain" />
            </div>
            <span className="text-xl font-bold text-foreground">CitadelTwin</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CitadelTwin. All rights reserved. Transforming civil engineering through intelligent digital twins.
          </p>
        </div>
      </div>
    </footer>
  );
};
