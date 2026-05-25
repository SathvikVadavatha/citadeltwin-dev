
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { AuthLayout } from "./AuthLayout";
import { Eye, EyeOff, Shield, Chrome, Building, Smartphone } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";

interface LoginPageProps {
  onNavigateToSignup: () => void;
  onNavigateToForgotPassword: () => void;
}

export const LoginPage = ({ onNavigateToSignup, onNavigateToForgotPassword }: LoginPageProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithOAuth, user, error: authError, clearError } = useAuth();
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Clear any auth errors when component mounts
  useEffect(() => {
    if (authError) {
      clearError();
    }
  }, []);

  // Redirect authenticated users (handles both initial load and post-login)
  useEffect(() => {
    if (user) {
      const returnTo = searchParams.get('returnTo') || '/dashboard';
      // Security: Validate returnTo is a safe relative path to prevent open redirects
      const safeReturnTo = returnTo.startsWith('/') && !returnTo.startsWith('//') && !returnTo.includes('://') 
        ? returnTo : '/dashboard';
      navigate(safeReturnTo, { replace: true });
    }
  }, [user, navigate, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      // Navigation is handled by the useEffect watching `user` state
      // This avoids race conditions with duplicate redirects
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to access your digital twin projects"
    >
      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="engineer@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="skeuo-input"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="skeuo-input pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            />
            <Label htmlFor="remember" className="text-sm text-muted-foreground">
              Remember me
            </Label>
          </div>
          <Button
            type="button"
            variant="link"
            className="px-0 text-sm text-accent hover:text-accent/80"
            onClick={onNavigateToForgotPassword}
          >
            Forgot password?
          </Button>
        </div>

        <Button
          type="submit"
          className="w-full skeuo-button-primary text-white font-semibold py-2.5"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </Button>

        <div className="relative">
          <Separator className="my-6" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-card px-2 text-xs uppercase text-muted-foreground">
              Or continue with SSO
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full border-border text-foreground hover:bg-secondary"
            disabled={!!oauthLoading}
            onClick={async () => { setOauthLoading('google'); await signInWithOAuth('google'); setOauthLoading(null); }}
          >
            <Chrome className="h-4 w-4 mr-2" />
            {oauthLoading === 'google' ? 'Redirecting...' : 'Continue with Google'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full border-border text-foreground hover:bg-secondary"
            disabled={!!oauthLoading}
            onClick={async () => { setOauthLoading('azure'); await signInWithOAuth('azure'); setOauthLoading(null); }}
          >
            <Building className="h-4 w-4 mr-2" />
            {oauthLoading === 'azure' ? 'Redirecting...' : 'Continue with Azure AD'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full border-border text-foreground hover:bg-secondary"
            disabled={!!oauthLoading}
            onClick={async () => { setOauthLoading('okta'); await signInWithOAuth('okta' as any); setOauthLoading(null); }}
          >
            <Shield className="h-4 w-4 mr-2" />
            {oauthLoading === 'okta' ? 'Redirecting...' : 'Continue with Okta'}
          </Button>
        </div>

        <div className="mt-6 p-3 rounded-lg bg-accent/10 border border-accent/20">
          <div className="flex items-center space-x-2 text-sm text-accent">
            <Smartphone className="h-4 w-4" />
            <span>Two-factor authentication enabled for enhanced security</span>
          </div>
        </div>

        <div className="text-center">
          <span className="text-sm text-muted-foreground">
            Don't have an account?{" "}
          </span>
          <Button
            variant="link"
            className="px-0 text-sm text-accent hover:text-accent/80"
            onClick={onNavigateToSignup}
          >
            Sign up
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};
