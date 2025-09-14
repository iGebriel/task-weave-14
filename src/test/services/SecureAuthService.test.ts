import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecureAuthService } from '@/services/auth/SecureAuthService';
import type { User } from '@/types';

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_API_BASE_URL: 'http://localhost:3000/api',
    NODE_ENV: 'development',
    VITE_USE_MOCK_AUTH: 'true'
  }
}));

// Mock fetch to prevent real HTTP requests
global.fetch = vi.fn();

// Set environment variables for tests
process.env.NODE_ENV = 'development';
process.env.VITE_USE_MOCK_AUTH = 'true';

describe('SecureAuthService', () => {
  let authService: SecureAuthService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Reset fetch mock
    vi.mocked(fetch).mockClear();

    // Create a new instance to ensure fresh state
    (SecureAuthService as any).instance = null;
    authService = SecureAuthService.getInstance();
  });

  describe('Interface Compliance', () => {
    it('should implement IAuthenticationService interface', () => {
      // Test that all required methods exist
      expect(typeof authService.getCurrentUser).toBe('function');
      expect(typeof authService.login).toBe('function');
      expect(typeof authService.register).toBe('function');
      expect(typeof authService.logout).toBe('function');
      expect(typeof authService.refreshToken).toBe('function');
      expect(typeof authService.forgotPassword).toBe('function');
      expect(typeof authService.resetPassword).toBe('function');
      expect(typeof authService.updateProfile).toBe('function');
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no user is logged in', () => {
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return current user after login', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Since we're in development with mock auth enabled, this should use mock login
      const result = await authService.login(credentials);
      const currentUser = authService.getCurrentUser();

      expect(currentUser).toEqual(result.user);
      expect(currentUser?.email).toBe('test@example.com');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      // First login to get a user
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Since we're in development with mock auth enabled, this should use mock login
      await authService.login(credentials);

      const updates = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      // Get the actual user ID from the logged in user
      const currentUser = authService.getCurrentUser();
      const updatedUser = await authService.updateProfile(currentUser!.id.toString(), updates);

      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.email).toBe('updated@example.com');
    });

    it('should throw error when updating profile for unauthorized user', async () => {
      const updates = {
        name: 'Updated Name'
      };

      await expect(authService.updateProfile('999', updates))
        .rejects.toThrow('Unauthorized');
    });

    it('should throw error when no user is logged in', async () => {
      const updates = {
        name: 'Updated Name'
      };

      await expect(authService.updateProfile('1', updates))
        .rejects.toThrow('Unauthorized');
    });
  });

  describe('refreshToken', () => {
    it('should generate new token', async () => {
      const newToken = await authService.refreshToken();
      expect(newToken).toBeDefined();
      expect(typeof newToken).toBe('string');
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const token = 'valid-reset-token';
      const newPassword = 'NewPassword123!';

      await expect(authService.resetPassword(token, newPassword))
        .resolves.not.toThrow();
    });
  });

  describe('Security Features', () => {
    it('should prevent mock auth in production', () => {
      // Clear the singleton instance to allow new instance creation
      (SecureAuthService as any).instance = null;

      // Mock production environment
      vi.doMock('import.meta', () => ({
        env: {
          NODE_ENV: 'production',
          VITE_USE_MOCK_AUTH: 'true'
        }
      }));

      expect(() => new SecureAuthService())
        .toThrow('SECURITY ERROR: Mock authentication cannot be enabled in production!');
    });

    it('should implement rate limiting', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Try multiple failed logins
      for (let i = 0; i < 6; i++) {
        try {
          await authService.login(credentials);
        } catch (error) {
          // Expected to fail
        }
      }

      // Should be rate limited now
      await expect(authService.login(credentials))
        .rejects.toThrow('Too many login attempts');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid email format', async () => {
      const credentials = {
        email: 'invalid-email',
        password: 'password123'
      };

      await expect(authService.login(credentials))
        .rejects.toThrow('Invalid email format');
    });

    it('should handle weak password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'weak'
      };

      await expect(authService.login(credentials))
        .rejects.toThrow('Password must be at least 8 characters');
    });

    it('should handle registration with mismatched passwords', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'differentpassword'
      };

      await expect(authService.register(userData))
        .rejects.toThrow('Passwords do not match');
    });
  });
});
