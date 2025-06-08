
import { ReactNode } from "react";
import { Building2 } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Branding */}
        <div className="text-center">
          <div className="w-16 h-16 bg-card border border-border rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">CitadelTwin</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Unified Civil Engineering Digital Twin Platform
          </p>
        </div>

        {/* Auth Form */}
        <div className="glass-effect rounded-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h2>
            <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>
          </div>
          {children}
        </div>

        {/* Security Footer */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>Protected by enterprise-grade security</p>
          <p>SOC 2 Type II • End-to-End Encrypted</p>
        </div>
      </div>
    </div>
  );
};
