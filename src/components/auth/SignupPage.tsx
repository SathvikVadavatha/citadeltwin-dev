
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { AuthLayout } from "./AuthLayout";
import { Eye, EyeOff, Chrome, Building, Shield, Mail } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "@/components/ui/use-toast";

interface SignupPageProps {
  onNavigateToLogin: () => void;
}

export const SignupPage = ({ onNavigateToLogin }: SignupPageProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
    company: "",
    acceptTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithOAuth } = useAuth();
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.acceptTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to continue.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8 || !/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters with uppercase, lowercase, and a number.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(formData.email, formData.password, {
        full_name: `${formData.firstName} ${formData.lastName}`,
        company: formData.company,
        role: formData.role,
      });

      if (result.error) {
        // Error toasts are already shown by AuthProvider
      } else if (result.needsConfirmation) {
        // Show email confirmation screen
        setSignupComplete(true);
      } else {
        // Auto-confirmed — user is already logged in, redirect happens via AuthProvider
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "Signup Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (signupComplete) {
    return (
      <AuthLayout
        title="Check Your Email"
        subtitle="We've sent a verification link to your email"
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-muted-foreground">
              We've sent a verification link to:
            </p>
            <p className="font-medium text-foreground">{formData.email}</p>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You must verify your email before you can sign in. Check your spam folder if you don't see it.
            </p>
            <Button
              variant="outline"
              onClick={onNavigateToLogin}
              className="w-full border-border hover:bg-secondary/20"
            >
              Go to Sign In
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join CitadelTwin to start building digital twins"
    >
      <form onSubmit={handleSignup} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              placeholder="John"
              value={formData.firstName}
              onChange={(e) => updateFormData("firstName", e.target.value)}
              className="skeuo-input"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              placeholder="Doe"
              value={formData.lastName}
              onChange={(e) => updateFormData("lastName", e.target.value)}
              className="skeuo-input"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="engineer@company.com"
            value={formData.email}
            onChange={(e) => updateFormData("email", e.target.value)}
            className="skeuo-input"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            placeholder="Your Company Name"
            value={formData.company}
            onChange={(e) => updateFormData("company", e.target.value)}
            className="skeuo-input"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={formData.role} onValueChange={(value) => updateFormData("role", value)}>
            <SelectTrigger className="skeuo-input">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="engineer">Engineer</SelectItem>
              <SelectItem value="reviewer">Reviewer</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password (min. 8 characters, mixed case + number)"
              value={formData.password}
              onChange={(e) => updateFormData("password", e.target.value)}
              className="skeuo-input pr-10"
              required
              minLength={8}
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

        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={formData.acceptTerms}
            onCheckedChange={(checked) => updateFormData("acceptTerms", checked as boolean)}
          />
          <Label htmlFor="terms" className="text-sm text-muted-foreground">
            I agree to the{" "}
            <a href="#" className="text-accent hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-accent hover:underline">Privacy Policy</a>
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full skeuo-button-primary text-white font-semibold py-2.5"
          disabled={loading}
        >
          {loading ? "Creating account..." : "Create Account"}
        </Button>

        <div className="relative">
          <Separator className="my-6" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-card px-2 text-xs uppercase text-muted-foreground">
              Or sign up with SSO
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

        <div className="text-center">
          <span className="text-sm text-muted-foreground">
            Already have an account?{" "}
          </span>
          <Button
            variant="link"
            className="px-0 text-sm text-accent hover:text-accent/80"
            onClick={onNavigateToLogin}
          >
            Sign in
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};
