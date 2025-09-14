/**
 * Auth Service Adapter
 * Ensures consistent authentication service usage between Redux and Service Container
 */

import { IAuthenticationService } from '../interfaces';
import { SecureAuthService } from '../auth/SecureAuthService';

/**
 * Singleton adapter that provides consistent auth service access
 * This ensures both Redux and Service Container use the same instance
 */
class AuthServiceAdapter {
  private static instance: AuthServiceAdapter;
  private authService: IAuthenticationService;

  private constructor() {
    // Always use SecureAuthService as the single source of truth
    this.authService = SecureAuthService.getInstance();
  }

  static getInstance(): AuthServiceAdapter {
    if (!AuthServiceAdapter.instance) {
      AuthServiceAdapter.instance = new AuthServiceAdapter();
    }
    return AuthServiceAdapter.instance;
  }

  /**
   * Get the authentication service instance
   */
  getAuthService(): IAuthenticationService {
    return this.authService;
  }

  /**
   * Proxy methods to the underlying auth service
   */
  getCurrentUser() {
    return this.authService.getCurrentUser();
  }

  async login(credentials: { email: string; password: string }) {
    return this.authService.login(credentials);
  }

  async register(userData: { name: string; email: string; password: string }) {
    return this.authService.register(userData);
  }

  async logout() {
    return this.authService.logout();
  }

  async forgotPassword(email: string) {
    return this.authService.forgotPassword(email);
  }

  async updateProfile(userId: string, updates: any) {
    return this.authService.updateProfile(userId, updates);
  }
}

export const authServiceAdapter = AuthServiceAdapter.getInstance();
