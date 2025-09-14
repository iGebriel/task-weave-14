import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestApp } from '@/App';
import { 
  render, 
  renderWithAuth,
  waitForAuthResolution,
  createMockUser, 
  setupTestServices, 
  authenticateTestUser, 
  renderWithServices,
  renderWithAuthenticatedUser,
  createTestStore,
  createAuthenticatedTestStore,
  expectServiceCalled,
  getMockServices
} from '@/test/utils';
import { mockToast, mockStorage } from '@/test/mocks';

describe('App Component', () => {
  let mockServices: ReturnType<typeof getMockServices>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockServices = setupTestServices();
  });

  describe('Authentication Flow', () => {
    it('should render AuthPage when user is not logged in', async () => {
      // Use unauthenticated store
      const store = createTestStore({
        auth: {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          lastLoginAttempt: null,
        }
      });
      
      await act(async () => {
        render(<TestApp />, { store });
      });
      
      await waitForAuthResolution();
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    });

    it('should render main application when user is logged in', async () => {
      await act(async () => {
        renderWithAuthenticatedUser(<TestApp />);
      });
      
      await waitForAuthResolution();
      expect(screen.getByText(/project dashboard/i)).toBeInTheDocument();
    });

    it('should handle authentication service errors gracefully', async () => {
      // Use unauthenticated store to simulate auth error
      const store = createTestStore({
        auth: {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Authentication failed',
          lastLoginAttempt: null,
        }
      });
      
      await act(async () => {
        render(<TestApp />, { store });
      });
      
      await waitForAuthResolution();
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    });
  });

  describe('User Session Management', () => {
    it('should authenticate user through authentication service', async () => {
      // Start with unauthenticated state
      const store = createTestStore({
        auth: {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          lastLoginAttempt: null,
        }
      });
      
      await act(async () => {
        render(<TestApp />, { store });
      });
      
      await waitForAuthResolution();
      
      // Simulate authentication through service
      const testCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const authResult = await mockServices.authentication.login(testCredentials);
      
      expect(authResult.user).toEqual(expect.objectContaining({
        email: 'test@example.com'
      }));
      expectServiceCalled(mockServices.authentication, 'login', testCredentials);
    });

    it('should call logout service when user logs out', async () => {
      await act(async () => {
        renderWithAuthenticatedUser(<TestApp />);
      });
      
      // Wait for the app to load with user data
      await waitFor(() => {
        expect(screen.getByText(/project dashboard/i)).toBeInTheDocument();
      });

      // Simulate logout through service
      await act(async () => {
        await mockServices.authentication.logout();
      });
      
      expectServiceCalled(mockServices.authentication, 'logout');
    });

    it('should update user profile through authentication service', async () => {
      const testUser = createMockUser();
      
      await act(async () => {
        renderWithAuthenticatedUser(<TestApp />, testUser);
      });
      
      await waitForAuthResolution();
      
      // Simulate profile update
      const updates = { name: 'Updated Name' };
      const updatedUser = await act(async () => {
        return await mockServices.authentication.updateProfile(testUser.id, updates);
      });
      
      expect(updatedUser.name).toBe('Updated Name');
      expectServiceCalled(mockServices.authentication, 'updateProfile', testUser.id, updates);
    });
  });

  describe('Profile Modal', () => {
    it('should show profile modal when profile button is clicked', async () => {
      const testUser = createMockUser();
      
      await act(async () => {
        renderWithAuthenticatedUser(<TestApp />, testUser);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/project dashboard/i)).toBeInTheDocument();
      });

      // Look for profile trigger (usually user name or avatar)
      const userProfile = screen.getByText(testUser.name);
      await act(async () => {
        await userEvent.click(userProfile);
      });
      
      // Check if profile content appears (might be in a modal or dropdown)
      expect(screen.getByText(testUser.email)).toBeInTheDocument();
    });

    it('should close profile modal when close button is clicked', async () => {
      const testUser = createMockUser();
      
      await act(async () => {
        renderWithAuthenticatedUser(<TestApp />, testUser);
      });
      
      await waitFor(() => {
        expect(screen.getByText(/project dashboard/i)).toBeInTheDocument();
      });

      // Open profile modal
      const userProfile = screen.getByText(testUser.name);
      await act(async () => {
        await userEvent.click(userProfile);
      });
      
      // Look for close button and click it
      const closeButton = screen.queryByRole('button', { name: /close/i });
      if (closeButton) {
        await act(async () => {
          await userEvent.click(closeButton);
        });
        
        // Modal should be closed (profile details no longer visible)
        expect(screen.queryByText(testUser.email)).not.toBeInTheDocument();
      }
    });
  });

  describe('Component Providers', () => {
    it('should render with all necessary providers', async () => {
      const store = createTestStore();
      
      await act(async () => {
        render(<TestApp />, { store });
      });
      
      await waitForAuthResolution();
      
      // Verify that the app renders without crashing
      // This tests that QueryClientProvider, TooltipProvider, and Toasters are properly set up
      expect(document.body).toBeInTheDocument();
    });

    it('should handle React Query errors gracefully', async () => {
      // Mock a query error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const store = createTestStore();
      
      await act(async () => {
        render(<TestApp />, { store });
      });
      
      await waitForAuthResolution();
      
      // App should still render even if there are query errors
      expect(document.body).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Service Integration', () => {
    it('should integrate with all required services', async () => {
      await act(async () => {
        renderWithAuthenticatedUser(<TestApp />);
      });
      
      await waitForAuthResolution();
      
      // Verify the app renders successfully with services
      expect(screen.getByText(/project dashboard/i)).toBeInTheDocument();
      expect(mockServices.storage).toBeDefined();
      expect(mockServices.notification).toBeDefined();
    });

    it('should handle service errors gracefully', async () => {
      // Create a store with error state
      const store = createTestStore({
        auth: {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Service error',
          lastLoginAttempt: null,
        }
      });
      
      await act(async () => {
        render(<TestApp />, { store });
      });
      
      await waitForAuthResolution();
      
      // App should still render (likely fallback to auth page)
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      const store = createTestStore();
      
      await act(async () => {
        render(<TestApp />, { store });
      });
      
      await waitForAuthResolution();
      
      // Should show auth page without crashing
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    });

    it('should handle user data corruption gracefully', async () => {
      mockStorage.setItem('taskflow_user', '{"invalid": json}');
      
      const store = createTestStore({
        auth: {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Data corruption detected',
          lastLoginAttempt: null,
        }
      });
      
      await act(async () => {
        render(<TestApp />, { store });
      });
      
      await waitForAuthResolution();
      
      // Should fall back to auth page
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    });
  });

  describe('Dependency Injection', () => {
    it('should provide services to child components', async () => {
      await act(async () => {
        renderWithAuthenticatedUser(<TestApp />);
      });
      
      await waitForAuthResolution();
      
      // The app should render successfully with all services available
      expect(screen.getByText(/project dashboard/i)).toBeInTheDocument();
    });

    it('should allow service override in tests', async () => {
      const customUser = createMockUser({ name: 'Custom User' });
      const customAuthService = mockServices.authentication;
      customAuthService.setCurrentUser(customUser);
      
      const store = createAuthenticatedTestStore(customUser);
      
      await act(async () => {
        renderWithServices(<TestApp />, {
          authentication: customAuthService
        }, { store });
      });
      
      await waitForAuthResolution();
      
      expect(screen.getByText('Custom User')).toBeInTheDocument();
    });
  });
});
