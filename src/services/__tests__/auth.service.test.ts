import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from '../auth.service';
import { HttpClient } from '@/lib/http-client';
import { ApiException } from '@/types/api';
import type { LoginRequest, LoginResponse, User } from '@/types/api';

// Mock HttpClient
vi.mock('@/lib/http-client');

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('AuthService', () => {
  let authService: AuthService;
  let mockHttpClient: vi.Mocked<HttpClient>;

  const mockUser: User = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
  };

  const mockLoginResponse: LoginResponse = {
    user: mockUser,
    token: 'mock-jwt-token-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});

    // Mock HttpClient
    mockHttpClient = {
      post: vi.fn(),
      setToken: vi.fn(),
      getToken: vi.fn().mockReturnValue(null),
    } as any;

    authService = new AuthService(mockHttpClient);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with null user when no stored data exists', () => {
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should restore user from localStorage if valid data exists', () => {
      const storedUserData = JSON.stringify(mockUser);
      const storedToken = 'stored-token';
      
      // Reset and setup storage mocks before creating new instance
      vi.clearAllMocks();
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'auth_user') return storedUserData;
        if (key === 'auth_token') return storedToken;
        return null;
      });
      
      // Create fresh mock that returns the stored token
      const freshMockHttpClient = {
        post: vi.fn(),
        setToken: vi.fn(),
        getToken: vi.fn().mockReturnValue(storedToken),
      } as any;

      const newAuthService = new AuthService(freshMockHttpClient);
      
      expect(newAuthService.getCurrentUser()).toEqual(mockUser);
      expect(newAuthService.isAuthenticated()).toBe(true);
      expect(freshMockHttpClient.setToken).toHaveBeenCalledWith(storedToken);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      vi.clearAllMocks();
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'auth_user') return 'invalid-json';
        return null;
      });
      localStorageMock.removeItem.mockImplementation(() => {});

      const freshMockHttpClient = {
        post: vi.fn(),
        setToken: vi.fn(),
        getToken: vi.fn().mockReturnValue(null),
      } as any;

      const newAuthService = new AuthService(freshMockHttpClient);
      
      expect(newAuthService.getCurrentUser()).toBeNull();
      expect(newAuthService.isAuthenticated()).toBe(false);
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginRequest: LoginRequest = {
        email: 'john@example.com',
        password: 'password123',
      };

      mockHttpClient.post.mockResolvedValue({
        success: true,
        data: mockLoginResponse,
        message: 'Login successful',
      });
      
      // Mock getToken to return the token after login
      mockHttpClient.getToken.mockReturnValue(mockLoginResponse.token);

      const result = await authService.login(loginRequest);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/login', loginRequest);
      expect(mockHttpClient.setToken).toHaveBeenCalledWith(mockLoginResponse.token);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(mockUser));
      expect(result).toEqual(mockLoginResponse);
      expect(authService.getCurrentUser()).toEqual(mockUser);
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should handle login failure with invalid credentials', async () => {
      const loginRequest: LoginRequest = {
        email: 'john@example.com',
        password: 'wrongpassword',
      };

      const apiError = new ApiException({
        message: 'Invalid email or password',
        status: 401,
      });

      mockHttpClient.post.mockRejectedValue(apiError);

      await expect(authService.login(loginRequest)).rejects.toThrow(ApiException);
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
      expect(mockHttpClient.setToken).toHaveBeenCalledWith(null);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should handle network errors during login', async () => {
      const loginRequest: LoginRequest = {
        email: 'john@example.com',
        password: 'password123',
      };

      const networkError = new ApiException({
        message: 'Network error. Please check your connection.',
        status: 0,
      });

      mockHttpClient.post.mockRejectedValue(networkError);

      await expect(authService.login(loginRequest)).rejects.toThrow(ApiException);
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should validate email format before sending request', async () => {
      const invalidLoginRequest: LoginRequest = {
        email: 'invalid-email',
        password: 'password123',
      };

      await expect(authService.login(invalidLoginRequest)).rejects.toThrow('Invalid email format');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should validate password length before sending request', async () => {
      const invalidLoginRequest: LoginRequest = {
        email: 'john@example.com',
        password: '123', // Too short
      };

      await expect(authService.login(invalidLoginRequest)).rejects.toThrow('Password must be at least 6 characters');
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should successfully logout when authenticated', async () => {
      // Setup authenticated state first
      mockHttpClient.post.mockResolvedValue({
        success: true,
        data: mockLoginResponse,
      });
      
      await authService.login({
        email: 'john@example.com',
        password: 'password123',
      });
      
      // Reset mocks to test logout specifically
      vi.clearAllMocks();
      
      await authService.logout();

      expect(mockHttpClient.setToken).toHaveBeenCalledWith(null);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should handle logout when not authenticated', async () => {
      await authService.logout();

      expect(mockHttpClient.setToken).toHaveBeenCalledWith(null);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when not authenticated', () => {
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('should return user when authenticated', async () => {
      mockHttpClient.post.mockResolvedValue({
        success: true,
        data: mockLoginResponse,
      });

      await authService.login({
        email: 'john@example.com',
        password: 'password123',
      });

      expect(authService.getCurrentUser()).toEqual(mockUser);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when not authenticated', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return true when authenticated', async () => {
      mockHttpClient.post.mockResolvedValue({
        success: true,
        data: mockLoginResponse,
      });
      
      // Mock getToken to return the token after login
      mockHttpClient.getToken.mockReturnValue(mockLoginResponse.token);

      await authService.login({
        email: 'john@example.com',
        password: 'password123',
      });

      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false after logout', async () => {
      // Login first
      mockHttpClient.post.mockResolvedValue({
        success: true,
        data: mockLoginResponse,
      });
      await authService.login({
        email: 'john@example.com',
        password: 'password123',
      });

      // Then logout
      await authService.logout();

      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return false when not authenticated', () => {
      expect(authService.isAdmin()).toBe(false);
    });

    it('should return false for regular users', async () => {
      const regularUser = { ...mockUser, role: 'user' as const };
      mockHttpClient.post.mockResolvedValue({
        success: true,
        data: { ...mockLoginResponse, user: regularUser },
      });

      await authService.login({
        email: 'john@example.com',
        password: 'password123',
      });

      expect(authService.isAdmin()).toBe(false);
    });

    it('should return true for admin users', async () => {
      const adminUser = { ...mockUser, role: 'admin' as const };
      mockHttpClient.post.mockResolvedValue({
        success: true,
        data: { ...mockLoginResponse, user: adminUser },
      });
      
      // Mock getToken to return the token after login
      mockHttpClient.getToken.mockReturnValue(mockLoginResponse.token);

      await authService.login({
        email: 'admin@example.com',
        password: 'password123',
      });

      expect(authService.isAdmin()).toBe(true);
    });
  });

  describe('getToken', () => {
    it('should return null when not authenticated', () => {
      mockHttpClient.getToken.mockReturnValue(null);
      expect(authService.getToken()).toBeNull();
    });

    it('should return token when authenticated', async () => {
      mockHttpClient.post.mockResolvedValue({
        success: true,
        data: mockLoginResponse,
      });
      mockHttpClient.getToken.mockReturnValue(mockLoginResponse.token);

      await authService.login({
        email: 'john@example.com',
        password: 'password123',
      });

      expect(authService.getToken()).toBe(mockLoginResponse.token);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const newToken = 'new-refreshed-token';
      const refreshResponse = {
        success: true,
        data: { token: newToken, user: mockUser },
      };

      mockHttpClient.post.mockResolvedValue(refreshResponse);
      mockHttpClient.getToken.mockReturnValue('old-token');

      const result = await authService.refreshToken();

      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/refresh');
      expect(mockHttpClient.setToken).toHaveBeenCalledWith(newToken);
      expect(result).toEqual(refreshResponse.data);
    });

    it('should handle refresh token failure', async () => {
      const refreshError = new ApiException({
        message: 'Invalid refresh token',
        status: 401,
      });

      mockHttpClient.post.mockRejectedValue(refreshError);

      await expect(authService.refreshToken()).rejects.toThrow(ApiException);
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      const validationResponse = {
        success: true,
        data: { user: mockUser, valid: true },
      };

      mockHttpClient.post.mockResolvedValue(validationResponse);

      const result = await authService.validateToken();

      expect(mockHttpClient.post).toHaveBeenCalledWith('/auth/validate');
      expect(result).toBe(true);
    });

    it('should handle invalid token', async () => {
      const validationError = new ApiException({
        message: 'Invalid token',
        status: 401,
      });

      mockHttpClient.post.mockRejectedValue(validationError);

      const result = await authService.validateToken();

      expect(result).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('event listeners', () => {
    it('should notify listeners on login', async () => {
      const listener = vi.fn();
      authService.onAuthStateChange(listener);

      mockHttpClient.post.mockResolvedValue({
        success: true,
        data: mockLoginResponse,
      });

      await authService.login({
        email: 'john@example.com',
        password: 'password123',
      });

      expect(listener).toHaveBeenCalledWith(mockUser);
    });

    it('should notify listeners on logout', async () => {
      const listener = vi.fn();
      
      // Login first
      mockHttpClient.post.mockResolvedValue({
        success: true,
        data: mockLoginResponse,
      });
      await authService.login({
        email: 'john@example.com',
        password: 'password123',
      });

      authService.onAuthStateChange(listener);
      vi.clearAllMocks();

      await authService.logout();

      expect(listener).toHaveBeenCalledWith(null);
    });

    it('should remove listeners correctly', async () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsubscribe1 = authService.onAuthStateChange(listener1);
      authService.onAuthStateChange(listener2);

      // Remove first listener
      unsubscribe1();

      mockHttpClient.post.mockResolvedValue({
        success: true,
        data: mockLoginResponse,
      });

      await authService.login({
        email: 'john@example.com',
        password: 'password123',
      });

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith(mockUser);
    });
  });
});