
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Lock, Shield } from "lucide-react";
import { SecurityCard } from "./SecurityCard";

export const SecuritySection = () => {
  return (
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
  );
};
