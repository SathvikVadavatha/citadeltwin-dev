
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AuthLayout } from "./AuthLayout";
import { Eye, EyeOff, Shield, Chrome, Building, Smartphone } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "@/components/ui/use-toast";

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
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        // Error handling is now done in the AuthProvider
        console.error("Login error:", error);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
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
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="engineer@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background border-border text-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background border-border text-foreground pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
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
            className="px-0 text-sm text-primary hover:text-primary/80"
            onClick={onNavigateToForgotPassword}
          >
            Forgot password?
          </Button>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary/90"
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
          <Button variant="outline" className="w-full border-border hover:bg-secondary/20">
            <Chrome className="h-4 w-4 mr-2" />
            Continue with Google
          </Button>
          <Button variant="outline" className="w-full border-border hover:bg-secondary/20">
            <Building className="h-4 w-4 mr-2" />
            Continue with Azure AD
          </Button>
          <Button variant="outline" className="w-full border-border hover:bg-secondary/20">
            <Shield className="h-4 w-4 mr-2" />
            Continue with Okta
          </Button>
        </div>

        <div className="mt-6 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center space-x-2 text-sm text-primary">
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
            className="px-0 text-sm text-primary hover:text-primary/80"
            onClick={onNavigateToSignup}
          >
            Sign up
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};
