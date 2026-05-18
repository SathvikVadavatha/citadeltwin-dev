
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Branding */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-primary text-primary-foreground shadow-skeuo-raised border border-border">
            <img src="/logo.png" alt="CitadelTwin" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            CitadelTwin
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Unified Civil Engineering Digital Twin Platform
          </p>
        </div>

        {/* Auth Form */}
        <div className="skeuo-card rounded-xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>
          {children}
        </div>

        {/* Security Footer */}
        <div className="text-center text-xs space-y-1 text-muted-foreground">
          <p>Protected by enterprise-grade security</p>
          <p>SOC 2 Type II &bull; End-to-End Encrypted</p>
        </div>
      </div>
    </div>
  );
};
