import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loginUser, registerUser, forgotPassword, selectAuthLoading, selectAuthError } from "@/store/slices/authSlice";
import { toast } from "sonner";
import type { User } from "@/types";

type AuthView = "login" | "register" | "forgot-password";

interface AuthPageProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthPage = ({ onAuthSuccess }: AuthPageProps) => {
  const [currentView, setCurrentView] = useState<AuthView>("login");
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectAuthLoading);
  const authError = useAppSelector(selectAuthError);

  const handleLogin = async (email: string, password: string) => {
    try {
      const resultAction = await dispatch(loginUser({ email, password }));
      if (loginUser.fulfilled.match(resultAction)) {
        toast.success("Welcome back!");
        onAuthSuccess(resultAction.payload);
      } else {
        toast.error(resultAction.payload as string || "Login failed");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Login failed";
      toast.error(message);
    }
  };

  const handleRegister = async (data: { name: string; email: string; password: string }) => {
    try {
      const resultAction = await dispatch(registerUser(data));
      if (registerUser.fulfilled.match(resultAction)) {
        toast.success("Account created successfully!");
        onAuthSuccess(resultAction.payload);
      } else {
        toast.error(resultAction.payload as string || "Failed to create account. Please try again.");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Registration failed";
      toast.error(message);
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      const resultAction = await dispatch(forgotPassword(email));
      if (forgotPassword.fulfilled.match(resultAction)) {
        toast.success("Reset link sent to your email");
      } else {
        toast.error(resultAction.payload as string || "Failed to send reset email");
        throw new Error(resultAction.payload as string);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to send reset email";
      toast.error(message);
      throw error;
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