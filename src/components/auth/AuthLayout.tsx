
import { ReactNode } from "react";
import { Building2 } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        backgroundColor: 'hsl(222.2 84% 4.9%)',
        color: 'hsl(210 40% 98%)'
      }}
    >
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Branding */}
        <div className="text-center">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ 
              backgroundColor: 'hsl(222.2 84% 4.9%)',
              border: '1px solid hsl(217.2 32.6% 17.5%)'
            }}
          >
            <Building2 className="w-8 h-8" style={{ color: 'hsl(210 40% 98%)' }} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'hsl(210 40% 98%)' }}>
            CitadelTwin
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'hsl(215.4 16.3% 46.9%)' }}>
            Unified Civil Engineering Digital Twin Platform
          </p>
        </div>

        {/* Auth Form */}
        <div 
          className="rounded-xl p-8"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold tracking-tight" style={{ color: 'hsl(210 40% 98%)' }}>
              {title}
            </h2>
            <p className="mt-2 text-sm" style={{ color: 'hsl(215.4 16.3% 46.9%)' }}>
              {subtitle}
            </p>
          </div>
          {children}
        </div>

        {/* Security Footer */}
        <div className="text-center text-xs space-y-1" style={{ color: 'hsl(215.4 16.3% 46.9%)' }}>
          <p>Protected by enterprise-grade security</p>
          <p>SOC 2 Type II • End-to-End Encrypted</p>
        </div>
      </div>
    </div>
  );
};
