import { useState, useEffect, useCallback } from 'react';
import { useAuth, useNotification } from '@/services/context/ServiceContext';
import { User } from '@/types';
import { LoginCredentials, RegisterData } from '@/services/interfaces';

/**
 * Custom hook for authentication business logic
 * Separates authentication state management from UI components
 */
export const useAuthenticationLogic = () => {
  const authService = useAuth();
  const notification = useNotification();
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current user on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, [authService]);

  /**
   * Handle user login
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await authService.login(credentials);
      setUser(result.user);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authService]);

  /**
   * Handle user registration
   */
  const register = useCallback(async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await authService.register(userData);
      setUser(result.user);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authService]);

  /**
   * Handle user logout
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authService.logout();
      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      notification.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [authService, notification]);

  /**
   * Handle forgot password
   */
  const forgotPassword = useCallback(async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authService.forgotPassword(email);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send password reset';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authService]);

  /**
   * Handle password reset
   */
  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await authService.resetPassword(token, newPassword);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authService]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('No user is currently logged in');
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const updatedUser = await authService.updateProfile(user.id.toString(), updates);
      setUser(updatedUser);
      
      return updatedUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Profile update failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authService, user]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = user !== null;

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback((role: string) => {
    return user?.role === role;
  }, [user]);

  return {
    // State
    user,
    isLoading,
    error,
    isAuthenticated,
    
    // Actions
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    clearError,
    hasRole,
  };
};
