
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, EyeOff, Building2, Smartphone } from "lucide-react";

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            CitadelTwin
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Cloud-native digital-twin platform for civil engineering
          </p>
        </div>

        <Card className="bg-white/50 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your digital twin projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="engineer@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      />
                      <Label htmlFor="remember" className="text-sm">
                        Remember me
                      </Label>
                    </div>
                    <Button variant="link" className="px-0 text-sm">
                      Forgot password?
                    </Button>
                  </div>

                  <Button type="submit" className="w-full">
                    <Lock className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </form>

                {/* SSO Options */}
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200 dark:border-slate-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">
                        Or continue with SSO
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Button variant="outline" className="w-full">
                      <Shield className="h-4 w-4 mr-2" />
                      Enterprise SSO
                    </Button>
                  </div>
                </div>

                {/* 2FA Notice */}
                <div className="mt-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-2 text-sm text-blue-800 dark:text-blue-200">
                    <Smartphone className="h-4 w-4" />
                    <span>Two-factor authentication required for enhanced security</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" placeholder="Jane" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" placeholder="Doe" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="engineer@company.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Input id="organization" placeholder="Your Company" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <select className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white dark:bg-slate-800 dark:border-slate-700">
                      <option>Residential Engineer</option>
                      <option>Municipal Planner</option>
                      <option>Industrial Lead</option>
                      <option>Project Manager</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Create a strong password"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Security Features */}
        <div className="mt-6 text-center space-y-2">
          <div className="flex items-center justify-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
            <Badge variant="outline" className="bg-white/50">
              <Shield className="h-3 w-3 mr-1" />
              SOC 2 Type II
            </Badge>
            <Badge variant="outline" className="bg-white/50">
              <Lock className="h-3 w-3 mr-1" />
              End-to-End Encrypted
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Protected by enterprise-grade security and OWASP compliance
          </p>
        </div>
      </div>
    </div>
  );
};
