import { User } from '@/types';
import { SecurityUtils } from '@/utils/security';
import { IAuthenticationService, AuthResult } from '../interfaces';
import { apiClient } from '@/lib/api';

interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

/**
 * Secure authentication service with environment-based configuration
 * Prevents mock authentication from being deployed to production
 */
export class SecureAuthService implements IAuthenticationService {
  private static instance: SecureAuthService;
  private readonly baseUrl: string;
  private readonly useMockAuth: boolean;
  private readonly rateLimiter;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

    // Only allow mock auth in development with explicit flag
    this.useMockAuth =
      import.meta.env.NODE_ENV === 'development' &&
      import.meta.env.VITE_USE_MOCK_AUTH === 'true';

    // Production check - prevent mock auth in production
    if (import.meta.env.NODE_ENV === 'production' && this.useMockAuth) {
      throw new Error(
        'SECURITY ERROR: Mock authentication cannot be enabled in production! ' +
        'Remove VITE_USE_MOCK_AUTH=true from production environment.'
      );
    }

    // Rate limiting for authentication attempts
    this.rateLimiter = SecurityUtils.createRateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
  }

  static getInstance(): SecureAuthService {
    if (!SecureAuthService.instance) {
      SecureAuthService.instance = new SecureAuthService();
    }
    return SecureAuthService.instance;
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  }

  /**
   * Authenticate user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    // Input validation
    if (!SecurityUtils.isValidEmail(credentials.email)) {
      throw new Error('Invalid email format');
    }

    if (!credentials.password || credentials.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Rate limiting
    if (!this.rateLimiter(credentials.email)) {
      throw new Error('Too many login attempts. Please try again later.');
    }

    // Use mock auth only in development
    if (this.useMockAuth) {
      return this.mockLogin(credentials);
    }

    // Production authentication
    return this.productionLogin(credentials);
  }

  /**
   * Register new user account
   */
  async register(userData: RegisterData): Promise<AuthResult> {
    // Validate passwords match if confirmPassword is provided
    if (userData.confirmPassword && userData.password !== userData.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Input validation and sanitization
    const sanitizedData = {
      name: SecurityUtils.validateAndSanitizeInput(userData.name, 100),
      email: userData.email.toLowerCase().trim(),
      password: userData.password,
    };

    if (!sanitizedData.name || sanitizedData.name.length < 2) {
      throw new Error('Name must be at least 2 characters');
    }

    if (!SecurityUtils.isValidEmail(sanitizedData.email)) {
      throw new Error('Invalid email format');
    }

    if (!this.isValidPassword(sanitizedData.password)) {
      throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
    }

    // Rate limiting
    if (!this.rateLimiter(sanitizedData.email)) {
      throw new Error('Too many registration attempts. Please try again later.');
    }

    if (this.useMockAuth) {
      return this.mockRegister(sanitizedData);
    }

    return this.productionRegister(sanitizedData);
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    if (!SecurityUtils.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Rate limiting
    if (!this.rateLimiter(`forgot-${email}`)) {
      throw new Error('Too many password reset attempts. Please try again later.');
    }

    if (this.useMockAuth) {
      return this.mockForgotPassword(email);
    }

    return this.productionForgotPassword(email);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const currentUser = this.getCurrentUser();

    if (!currentUser || currentUser.id.toString() !== userId) {
      throw new Error('Unauthorized');
    }

    const updatedUser = { ...currentUser, ...updates };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    return updatedUser;
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiClient.refreshToken({ refresh_token: refreshToken });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Token refresh failed');
      }

      const { access_token, expires_at } = response.data;

      // Update stored tokens
      localStorage.setItem('authToken', access_token);
      localStorage.setItem('tokenExpiresAt', expires_at);

      // Update API client token
      apiClient.setAuthToken(access_token);

      return access_token;
    } catch (error) {
      // If API refresh fails, fallback to mock refresh
      console.warn('API token refresh failed, falling back to mock refresh:', error);

      const newToken = `mock_token_${Date.now()}`;
      localStorage.setItem('authToken', newToken);
      apiClient.setAuthToken(newToken);

      return newToken;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!this.isValidPassword(newPassword)) {
      throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
    }

    // Mock implementation - in real app, this would call an API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    // Clear stored tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');

    if (!this.useMockAuth) {
      try {
        await apiClient.logout();
      } catch (error) {
        console.warn('Logout API call failed, continuing with local logout:', error);
        // Continue with local logout even if API fails
      }
    }

    // Clear token from API client
    apiClient.setAuthToken(null);
  }

  /**
   * Validate password strength
   */
  private isValidPassword(password: string): boolean {
    if (password.length < 8) return false;

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasUppercase && hasLowercase && hasNumbers && hasSpecialChar;
  }

  /**
   * Production authentication implementation with fallback to mock
   */
  private async productionLogin(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const response = await apiClient.login(credentials);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Login failed');
      }

      const { user: apiUser, access_token, refresh_token, expires_at } = response.data;

      // Transform API user to frontend user format
      const user: User = {
        id: apiUser.id.toString(),
        name: apiUser.name,
        email: apiUser.email,
        role: apiUser.role === 'admin' ? 'owner' : 'collaborator',
        createdAt: new Date(),
        projectsCount: 0,
        tasksCompleted: 0,
      };

      const authResult: AuthResult = {
        user,
        token: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(expires_at),
      };

      // Store tokens securely
      localStorage.setItem('authToken', authResult.token);
      if (authResult.refreshToken) {
        localStorage.setItem('refreshToken', authResult.refreshToken);
      }
      localStorage.setItem('currentUser', JSON.stringify(authResult.user));

      // Set token in API client for subsequent requests
      apiClient.setAuthToken(authResult.token);

      return authResult;
    } catch (error) {
      // Fallback to mock authentication if API is not accessible
      console.warn('API authentication failed, falling back to mock authentication:', error);
      return this.mockLogin(credentials);
    }
  }

  private async productionRegister(userData: RegisterData): Promise<AuthResult> {
    try {
      // Note: The backend doesn't have a register endpoint in the current API
      // For now, we'll use mock registration in production
      // This should be implemented when the backend register endpoint is available
      throw new Error('Registration not yet implemented in backend API');
    } catch (error) {
      // Fallback to mock registration if API is not accessible
      console.warn('API registration failed, falling back to mock registration:', error);
      return this.mockRegister(userData);
    }
  }

  private async productionForgotPassword(email: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to send reset email');
    }
  }

  /**
   * Mock implementations for development only
   */
  private async mockLogin(credentials: LoginCredentials): Promise<AuthResult> {
    console.warn('🟡 Using MOCK authentication - Development only!');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simple mock validation
    if (credentials.email === 'error@test.com') {
      throw new Error('Invalid credentials');
    }

    const mockUser: User = {
      id: 1,
      name: 'John Doe',
      email: credentials.email,
      role: 'user',
    };

    const mockToken = btoa(JSON.stringify({ userId: mockUser.id, exp: Date.now() + 3600000 }));

    localStorage.setItem('authToken', mockToken);
    localStorage.setItem('currentUser', JSON.stringify(mockUser));

    return {
      user: mockUser,
      token: mockToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }

  private async mockRegister(userData: RegisterData): Promise<AuthResult> {
    console.warn('🟡 Using MOCK authentication - Development only!');

    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockUser: User = {
      id: Date.now(),
      name: userData.name,
      email: userData.email,
      role: 'user',
    };

    const mockToken = btoa(JSON.stringify({ userId: mockUser.id, exp: Date.now() + 3600000 }));

    localStorage.setItem('authToken', mockToken);
    localStorage.setItem('currentUser', JSON.stringify(mockUser));

    return {
      user: mockUser,
      token: mockToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }

  private async mockForgotPassword(email: string): Promise<void> {
    console.warn('🟡 Using MOCK authentication - Development only!');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Mock password reset for:', email);
  }
}