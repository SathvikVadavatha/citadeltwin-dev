
import { Routes, Route } from 'react-router-dom';
import { AuthLayout as AuthLayoutComponent } from '@/components/auth/AuthLayout';
import { LoginPage } from '@/components/auth/LoginPage';
import { SignupPage } from '@/components/auth/SignupPage';
import { ForgotPasswordPage } from '@/components/auth/ForgotPasswordPage';

export const AuthLayout = () => {
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          <AuthLayoutComponent title="Welcome back" subtitle="Sign in to your account">
            <LoginPage />
          </AuthLayoutComponent>
        } 
      />
      <Route 
        path="/signup" 
        element={
          <AuthLayoutComponent title="Create account" subtitle="Get started with CitadelTwin">
            <SignupPage />
          </AuthLayoutComponent>
        } 
      />
      <Route 
        path="/forgot-password" 
        element={
          <AuthLayoutComponent title="Reset password" subtitle="Enter your email to reset your password">
            <ForgotPasswordPage />
          </AuthLayoutComponent>
        } 
      />
    </Routes>
  );
};
