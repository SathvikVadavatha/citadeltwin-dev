
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { AuthLayout } from "./AuthLayout";
import { Eye, EyeOff, Chrome, Building, Shield } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { toast } from "@/components/ui/use-toast";

interface SignupPageProps {
  onNavigateToLogin: () => void;
}

export const SignupPage = ({ onNavigateToLogin }: SignupPageProps) => {
  const [showPassword, setShowPassword] = useState(false);
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
  const { signUp } = useAuth();

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

    if (formData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(formData.email, formData.password, {
        full_name: `${formData.firstName} ${formData.lastName}`,
        company: formData.company,
        role: formData.role,
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: "Account Exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Signup Failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        // Success case is handled in AuthProvider
        // Switch to login view after successful signup
        setTimeout(() => {
          onNavigateToLogin();
        }, 2000);
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

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join CitadelTwin to start building digital twins"
    >
      <form onSubmit={handleSignup} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" style={{ color: 'hsl(210 40% 98%)' }}>First Name</Label>
            <Input
              id="firstName"
              placeholder="John"
              value={formData.firstName}
              onChange={(e) => updateFormData("firstName", e.target.value)}
              style={{ 
                backgroundColor: 'hsl(222.2 84% 4.9%)',
                border: '1px solid hsl(217.2 32.6% 17.5%)',
                color: 'hsl(210 40% 98%)'
              }}
              className="focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" style={{ color: 'hsl(210 40% 98%)' }}>Last Name</Label>
            <Input
              id="lastName"
              placeholder="Doe"
              value={formData.lastName}
              onChange={(e) => updateFormData("lastName", e.target.value)}
              style={{ 
                backgroundColor: 'hsl(222.2 84% 4.9%)',
                border: '1px solid hsl(217.2 32.6% 17.5%)',
                color: 'hsl(210 40% 98%)'
              }}
              className="focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="engineer@company.com"
            value={formData.email}
            onChange={(e) => updateFormData("email", e.target.value)}
            className="bg-background border-border text-foreground"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company" className="text-foreground">Company</Label>
          <Input
            id="company"
            placeholder="Your Company Name"
            value={formData.company}
            onChange={(e) => updateFormData("company", e.target.value)}
            className="bg-background border-border text-foreground"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role" className="text-foreground">Role</Label>
          <Select value={formData.role} onValueChange={(value) => updateFormData("role", value)}>
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="engineer">Engineer</SelectItem>
              <SelectItem value="reviewer">Reviewer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password (min. 6 characters)"
              value={formData.password}
              onChange={(e) => updateFormData("password", e.target.value)}
              className="bg-background border-border text-foreground pr-10"
              required
              minLength={6}
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

        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={formData.acceptTerms}
            onCheckedChange={(checked) => updateFormData("acceptTerms", checked as boolean)}
          />
          <Label htmlFor="terms" className="text-sm text-muted-foreground">
            I agree to the{" "}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </Label>
        </div>

        <Button 
          type="submit" 
          className="w-full"
          style={{ 
            backgroundColor: 'hsl(194.4 95.3% 60.4%)',
            color: 'hsl(222.2 84% 4.9%)'
          }}
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

        <div className="text-center">
          <span className="text-sm text-muted-foreground">
            Already have an account?{" "}
          </span>
          <Button
            variant="link"
            className="px-0 text-sm text-primary hover:text-primary/80"
            onClick={onNavigateToLogin}
          >
            Sign in
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};
