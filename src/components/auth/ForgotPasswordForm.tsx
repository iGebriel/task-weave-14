import { useState } from "react";
import { Mail, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface ForgotPasswordFormProps {
  onResetPassword: (email: string) => Promise<void>;
  onBackToLogin: () => void;
  isLoading?: boolean;
}

export const ForgotPasswordForm = ({ onResetPassword, onBackToLogin, isLoading }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email) {
      setError("Email is required");
      return;
    }
    
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      await onResetPassword(email);
      setIsSubmitted(true);
    } catch (err) {
      setError("Failed to send reset email. Please try again.");
    }
  };

  if (isSubmitted) {
    return (
      <Card className="card-elegant w-full max-w-md mx-auto">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Check Your Email
          </h1>
          <p className="text-muted-foreground mb-6">
            We've sent a password reset link to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <Button
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              className="w-full"
            >
              Try Different Email
            </Button>
            <Button
              onClick={onBackToLogin}
              variant="ghost"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="card-elegant w-full max-w-md mx-auto">
      <div className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Reset Password
          </h1>
          <p className="text-muted-foreground mt-2">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`pl-10 ${error ? 'border-destructive' : ''}`}
                placeholder="Enter your email address"
                disabled={isLoading}
                autoFocus
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="space-y-3">
            <Button
              type="submit"
              className="w-full btn-hero"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Send Reset Link
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={onBackToLogin}
              variant="ghost"
              className="w-full"
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
};