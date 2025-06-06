import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Github, Lock } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  rememberMe: z.boolean().optional()
});

const signupSchema = z.object({
  fullName: z.string().min(2, { message: "Please enter your full name." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  company: z.string().optional(),
  role: z.enum(["engineer", "planner", "industrial"]),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions." }),
  })
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

interface LoginFormProps {
  showLogin: boolean;
  setShowLogin: (show: boolean) => void;
}

export const LoginForm = ({ showLogin, setShowLogin }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false
    }
  });

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      company: "",
      role: "engineer",
      acceptTerms: false
    }
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      
      toast({
        title: "Success!",
        description: "You have been logged in successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSignupSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            company: data.company,
            role: data.role
          }
        }
      });

      if (error) throw error;
      
      toast({
        title: "Account created!",
        description: "Please check your email for verification instructions.",
      });
      
      // Switch to login view after successful signup
      setShowLogin(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tabs value={showLogin ? "login" : "signup"} onValueChange={(value) => setShowLogin(value === "login")}>
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="login">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Create Account</TabsTrigger>
      </TabsList>
      
      <TabsContent value="login" className="space-y-4">
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        {...field} 
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center justify-between">
              <FormField
                control={loginForm.control}
                name="rememberMe"
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember" 
                      checked={field.value} 
                      onCheckedChange={field.onChange}
                    />
                    <label 
                      htmlFor="remember" 
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Remember me
                    </label>
                  </div>
                )}
              />
              <Button type="button" variant="link" className="text-sm p-0">
                Forgot password?
              </Button>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing In..." : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </Form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-2">Or</span>
          </div>
        </div>
        
        <Button variant="outline" className="w-full" disabled={isLoading}>
          <Github className="h-4 w-4 mr-2" /> Sign in with GitHub
        </Button>
      </TabsContent>
      
      <TabsContent value="signup" className="space-y-4">
        <Form {...signupForm}>
          <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
            <FormField
              control={signupForm.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={signupForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={signupForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        {...field} 
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={signupForm.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Organization" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={signupForm.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <select
                      className="w-full px-3 py-2 border border-slate-200 rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      {...field}
                    >
                      <option value="engineer">Residential Engineer</option>
                      <option value="planner">Municipal Planner</option>
                      <option value="industrial">Industrial Lead</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={signupForm.control}
              name="acceptTerms"
              render={({ field }) => (
                <div className="flex items-start space-x-2 mt-4">
                  <Checkbox 
                    id="terms" 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                  />
                  <label 
                    htmlFor="terms" 
                    className="text-sm leading-none"
                  >
                    I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                  </label>
                  {signupForm.formState.errors.acceptTerms && (
                    <p className="text-sm font-medium text-red-500 mt-1">
                      {signupForm.formState.errors.acceptTerms.message}
                    </p>
                  )}
                </div>
              )}
            />
            
            <Button type="submit" className="w-full mt-6" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
};
