
import React, { useState } from 'react';
import { LoginPage } from '@/components/auth/LoginPage';
import { SignupPage } from '@/components/auth/SignupPage';

export const AuthPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<'login' | 'signup'>('login');

  const handleNavigateToSignup = () => {
    setCurrentView('signup');
  };

  const handleNavigateToLogin = () => {
    setCurrentView('login');
  };

  const handleNavigateToForgotPassword = () => {
    // TODO: Implement forgot password flow when needed
    console.log('Forgot password clicked');
  };

  if (currentView === 'signup') {
    return (
      <SignupPage 
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
