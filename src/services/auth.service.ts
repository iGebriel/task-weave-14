import { HttpClient } from '@/lib/http-client';
import { ApiException } from '@/types/api';
import type { LoginRequest, LoginResponse, User } from '@/types/api';

export type AuthStateChangeListener = (user: User | null) => void;

/**
 * Authentication service for managing user login, logout, and session state
 */
export class AuthService {
  private currentUser: User | null = null;
  private authStateListeners: Set<AuthStateChangeListener> = new Set();

  constructor(private httpClient: HttpClient) {
    this.loadStoredAuthState();
  }

  /**
   * Load stored authentication state from localStorage
   */
  private loadStoredAuthState(): void {
    try {
      const storedUser = localStorage.getItem('auth_user');
      const storedToken = localStorage.getItem('auth_token');

      if (storedUser && storedToken) {
        this.currentUser = JSON.parse(storedUser);
        this.httpClient.setToken(storedToken);
      }
    } catch (error) {
      // Handle corrupted localStorage data
      console.warn('Failed to load stored authentication state:', error);
      this.clearStoredAuthState();
    }
  }

  /**
   * Clear stored authentication state from localStorage
   */
  private clearStoredAuthState(): void {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Notify auth state change listeners
   */
  private notifyAuthStateChange(): void {
    this.authStateListeners.forEach(listener => {
      listener(this.currentUser);
    });
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // Validate input
    if (!this.validateEmail(credentials.email)) {
      throw new Error('Invalid email format');
    }

    if (credentials.password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    try {
      const response = await this.httpClient.post<LoginResponse>('/auth/login', credentials);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Store authentication state
        this.currentUser = user;
        this.httpClient.setToken(token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        
        // Notify listeners
        this.notifyAuthStateChange();
        
        return response.data;
      }
      
      throw new ApiException({
        message: 'Login failed',
        status: 500,
      });
    } catch (error) {
      // Clear any partial state on login failure
      this.currentUser = null;
      this.httpClient.setToken(null);
      this.clearStoredAuthState();
      
      throw error;
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    // Clear authentication state
    this.currentUser = null;
    this.httpClient.setToken(null);
    this.clearStoredAuthState();
    
    // Notify listeners
    this.notifyAuthStateChange();
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.httpClient.getToken() !== null;
  }

  /**
   * Check if current user is admin
   */
  isAdmin(): boolean {
    return this.isAuthenticated() && this.currentUser?.role === 'admin';
  }

  /**
   * Get current authentication token
   */
  getToken(): string | null {
    return this.httpClient.getToken();
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<{ token: string; user: User }> {
    try {
      const response = await this.httpClient.post<{ token: string; user: User }>('/auth/refresh');
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        
        // Update authentication state
        this.currentUser = user;
        this.httpClient.setToken(token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        
        // Notify listeners
        this.notifyAuthStateChange();
        
        return response.data;
      }
      
      throw new ApiException({
        message: 'Token refresh failed',
        status: 500,
      });
    } catch (error) {
      // Clear authentication state on refresh failure
      this.currentUser = null;
      this.httpClient.setToken(null);
      this.clearStoredAuthState();
      this.notifyAuthStateChange();
      
      throw error;
    }
  }

  /**
   * Validate current token
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await this.httpClient.post<{ user: User; valid: boolean }>('/auth/validate');
      
      if (response.success && response.data?.valid) {
        // Update user data if validation returns updated user info
        if (response.data.user) {
          this.currentUser = response.data.user;
          localStorage.setItem('auth_user', JSON.stringify(response.data.user));
          this.notifyAuthStateChange();
        }
        return true;
      }
      
      return false;
    } catch (error) {
      // Clear authentication state on validation failure
      this.currentUser = null;
      this.httpClient.setToken(null);
      this.clearStoredAuthState();
      this.notifyAuthStateChange();
      
      return false;
    }
  }

  /**
   * Subscribe to authentication state changes
   */
  onAuthStateChange(listener: AuthStateChangeListener): () => void {
    this.authStateListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.authStateListeners.delete(listener);
    };
  }
}

// We'll create the singleton instance later to avoid circular dependencies
// Import this in a separate file or initialize it in the application bootstrap
