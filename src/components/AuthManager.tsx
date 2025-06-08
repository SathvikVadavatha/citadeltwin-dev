
import { useState } from "react";
import { LoginPage } from "./auth/LoginPage";
import { SignupPage } from "./auth/SignupPage";
import { ForgotPasswordPage } from "./auth/ForgotPasswordPage";

type AuthView = "login" | "signup" | "forgot-password";

export const AuthManager = () => {
  const [currentView, setCurrentView] = useState<AuthView>("login");

  const renderAuthView = () => {
    switch (currentView) {
      case "login":
        return (
          <LoginPage
            onNavigateToSignup={() => setCurrentView("signup")}
            onNavigateToForgotPassword={() => setCurrentView("forgot-password")}
          />
        );
      case "signup":
        return (
          <SignupPage
            onNavigateToLogin={() => setCurrentView("login")}
          />
        );
      case "forgot-password":
        return (
          <ForgotPasswordPage
            onNavigateToLogin={() => setCurrentView("login")}
          />
        );
      default:
        return null;
    }
  };

  return renderAuthView();
};
