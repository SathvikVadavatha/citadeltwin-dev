
import React, { useState, useEffect } from 'react';
import { LoginPage } from '@/components/auth/LoginPage';
import { SignupPage } from '@/components/auth/SignupPage';
import { ForgotPasswordPage } from '@/components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/components/auth/ResetPasswordPage';

export const AuthPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<'login' | 'signup' | 'forgot-password' | 'reset-password'>('login');

  // Check URL hash for password recovery
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      if (params.get('type') === 'recovery') {
        setCurrentView('reset-password');
      }
    }
  }, []);

  const handleNavigateToSignup = () => {
    setCurrentView('signup');
  };

  const handleNavigateToLogin = () => {
    setCurrentView('login');
  };

  const handleNavigateToForgotPassword = () => {
    setCurrentView('forgot-password');
  };

  if (currentView === 'signup') {
    return (
      <SignupPage 
        onNavigateToLogin={handleNavigateToLogin}
      />
    );
  }

  if (currentView === 'forgot-password') {
    return (
      <ForgotPasswordPage 
        onNavigateToLogin={handleNavigateToLogin}
      />
    );
  }

  if (currentView === 'reset-password') {
    return (
      <ResetPasswordPage 
        onNavigateToLogin={handleNavigateToLogin}
      />
    );
  }

  return (
    <LoginPage 
      onNavigateToSignup={handleNavigateToSignup}
      onNavigateToForgotPassword={handleNavigateToForgotPassword}
    />
  );
};
