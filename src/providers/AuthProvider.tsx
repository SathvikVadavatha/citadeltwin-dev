
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session, Provider } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any; needsConfirmation?: boolean }>;
  signInWithOAuth: (provider: Provider) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializationRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearError = () => setError(null);

  const handleAuthStateChange = (event: string, session: Session | null) => {
    setSession(session);
    setUser(session?.user || null);

    // Handle password recovery flow
    if (event === 'PASSWORD_RECOVERY') {
      // The session will contain the recovery tokens
    }
    
    // Only set loading to false after we've processed the auth state
    if (initializationRef.current) {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Set a timeout to prevent infinite loading
        timeoutRef.current = setTimeout(() => {
          if (mounted && loading) {
            console.warn('Auth initialization timeout - setting loading to false');
            setLoading(false);
            setError('Authentication check timed out');
          }
        }, 10000); // 10 second timeout

        // Set up auth state listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

        // Then get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(sessionError.message);
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user || null);
          initializationRef.current = true;
          setLoading(false);
          
          // Clear timeout since we successfully initialized
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setError('Failed to initialize authentication');
          setLoading(false);
        }
      }
    };

    const cleanup = initializeAuth();

    return () => {
      mounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      cleanup.then(unsubscribe => unsubscribe?.());
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Provide user-friendly error messages for common auth failures
        let userMessage = error.message;
        if (error.message.includes('Email not confirmed')) {
          userMessage = "Your email has not been verified. Please check your inbox (and spam folder) for the verification link.";
        } else if (error.message.includes('Invalid login credentials')) {
          userMessage = "Invalid email or password. Please check your credentials and try again.";
        }

        setError(userMessage);
        toast({
          title: "Sign In Failed",
          description: userMessage,
          variant: "destructive",
        });
        return { error: { ...error, message: userMessage } };
      }

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });

      return { error: null };
    } catch (error: any) {
      const errorMessage = "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/login`,
          data: metadata,
        },
      });

      if (error) {
        setError(error.message);
        toast({
          title: "Sign Up Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      // Detect fake success: user already exists (Supabase returns empty identities)
      if (data?.user && data.user.identities?.length === 0) {
        const existsError = { message: "An account with this email already exists. Please sign in instead." };
        setError(existsError.message);
        toast({
          title: "Account Exists",
          description: existsError.message,
          variant: "destructive",
        });
        return { error: existsError };
      }

      // If session is null, email confirmation is required
      if (data?.user && !data.session) {
        toast({
          title: "Account Created!",
          description: "Please check your email for a verification link. You must verify your email before signing in.",
        });
      } else {
        // Session exists = auto-confirmed, user is logged in
        toast({
          title: "Welcome!",
          description: "Your account has been created and you're now signed in.",
        });
      }

      return { error: null, needsConfirmation: !data.session };
    } catch (error: any) {
      const errorMessage = "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      toast({
        title: "Sign Up Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
        toast({
          title: "Password Update Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password Updated",
          description: "Your password has been successfully updated.",
        });
      }

      return { error };
    } catch (error: any) {
      const errorMessage = "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      toast({
        title: "Password Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signInWithOAuth = async (provider: Provider) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/login`,
        },
      });

      if (error) {
        setError(error.message);
        toast({
          title: "SSO Sign In Failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      const errorMessage = "Failed to initiate SSO sign in. Please try again.";
      setError(errorMessage);
      toast({
        title: "SSO Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await supabase.auth.signOut();
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      setError('Failed to sign out');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      error,
      signIn,
      signUp,
      signInWithOAuth,
      signOut,
      updatePassword,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
};
