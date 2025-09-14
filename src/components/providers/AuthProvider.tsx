import React, { createContext, useContext, ReactNode } from 'react';
import { useAuthenticationLogic } from '@/hooks/business/useAuthenticationLogic';
import { User } from '@/types';
import { LoginCredentials, RegisterData } from '@/services/interfaces';

// Authentication context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (userData: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  clearError: () => void;
  hasRole: (role: string) => boolean;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props for the auth provider
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication provider component
 * Provides authentication state and methods to the component tree
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const authLogic = useAuthenticationLogic();

  return (
    <AuthContext.Provider value={authLogic}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 * Must be used within an AuthProvider
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
