
import React, { useState } from 'react';
import { LoginPage } from '@/components/auth/LoginPage';
import { SignupPage } from '@/components/auth/SignupPage';
import { ForgotPasswordPage } from '@/components/auth/ForgotPasswordPage';

export const AuthPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<'login' | 'signup' | 'forgot-password'>('login');

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

  return (
    <LoginPage 
      onNavigateToSignup={handleNavigateToSignup}
      onNavigateToForgotPassword={handleNavigateToForgotPassword}
    />
  );
};
