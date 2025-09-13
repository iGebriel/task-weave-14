import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { toast } from "sonner";

type AuthView = "login" | "register" | "forgot-password";

interface AuthPageProps {
  onAuthSuccess: (user: any) => void;
}

export const AuthPage = ({ onAuthSuccess }: AuthPageProps) => {
  const [currentView, setCurrentView] = useState<AuthView>("login");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // TODO: Replace with your API call
      console.log("Login attempt:", { email, password });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login
      const mockUser = {
        id: 1,
        name: "John Doe",
        email: email,
        avatar: null,
        role: "user"
      };
      
      toast.success("Welcome back!");
      onAuthSuccess(mockUser);
    } catch (error) {
      toast.error("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: { name: string; email: string; password: string }) => {
    setIsLoading(true);
    try {
      // TODO: Replace with your API call
      console.log("Register attempt:", data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful registration
      const mockUser = {
        id: 1,
        name: data.name,
        email: data.email,
        avatar: null,
        role: "user"
      };
      
      toast.success("Account created successfully!");
      onAuthSuccess(mockUser);
    } catch (error) {
      toast.error("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    setIsLoading(true);
    try {
      // TODO: Replace with your API call
      console.log("Forgot password for:", email);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Reset link sent to your email");
    } catch (error) {
      toast.error("Failed to send reset email");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md">
        {currentView === "login" && (
          <LoginForm
            onLogin={handleLogin}
            onSwitchToRegister={() => setCurrentView("register")}
            onForgotPassword={() => setCurrentView("forgot-password")}
            isLoading={isLoading}
          />
        )}
        
        {currentView === "register" && (
          <RegisterForm
            onRegister={handleRegister}
            onSwitchToLogin={() => setCurrentView("login")}
            isLoading={isLoading}
          />
        )}
        
        {currentView === "forgot-password" && (
          <ForgotPasswordForm
            onResetPassword={handleForgotPassword}
            onBackToLogin={() => setCurrentView("login")}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};