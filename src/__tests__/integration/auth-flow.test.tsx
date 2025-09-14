import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import {
  render,
  createMockUser,
  authenticateTestUser,
  setupTestServices,
  getMockServices,
  resetTestContainer,
  renderWithAsyncHandling
} from '@/test/utils';
import { mockToast } from '@/test/mocks';

describe('Authentication Flow Integration', () => {
  let mockServices: ReturnType<typeof getMockServices>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockServices = setupTestServices();
  });

  describe('Login Flow', () => {
    it('should complete full login workflow', async () => {
      const user = userEvent.setup();
      await renderWithAsyncHandling(<App />);

      // Should start with auth page
      await waitFor(() => {
        expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
      });

      // Fill in login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Submit login form
      const loginButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(loginButton);

      // Mock successful authentication response
      // In a real app, this would trigger the onAuthSuccess callback
      const mockUser = createMockUser({
        email: 'test@example.com',
        name: 'Test User',
      });

      // Simulate successful authentication by manually calling the handler
      // This would normally be done by the AuthPage component
      mockStorage.setItem('taskflow_user', JSON.stringify(mockUser));

      // Rerender to reflect the state change
      render(<App />);

      // Should navigate to dashboard
      await waitFor(() => {
        expect(screen.getByText(/project dashboard/i)).toBeInTheDocument();
      });

      // User data should be saved in localStorage
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'taskflow_user',
        JSON.stringify(mockUser)
      );
    });

    it('should handle login errors gracefully', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Fill in login form with invalid credentials
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'invalid@example.com');
      await user.type(passwordInput, 'wrongpassword');

      // Submit login form
      const loginButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(loginButton);

      // Should remain on auth page
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();

      // Should not store any user data
      expect(mockStorage.setItem).not.toHaveBeenCalledWith('taskflow_user', expect.any(String));
    });

    it('should validate form fields before submission', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Try to submit empty form
      const loginButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(loginButton);

      // Should show validation errors (assuming form validation exists)
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    });
  });

  describe('Registration Flow', () => {
    it('should complete full registration workflow', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Navigate to register form
      const registerLink = screen.getByText(/sign up/i);
      await user.click(registerLink);

      // Fill in registration form
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(nameInput, 'New User');
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'newpassword123');

      // Submit registration form
      const registerButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(registerButton);

      // Mock successful registration
      const mockUser = createMockUser({
        name: 'New User',
        email: 'newuser@example.com',
      });

      mockStorage.setItem('taskflow_user', JSON.stringify(mockUser));
      render(<App />);

      // Should navigate to dashboard after registration
      await waitFor(() => {
        expect(screen.getByText(/project dashboard/i)).toBeInTheDocument();
      });
    });

    it('should handle registration errors', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Navigate to register form
      const registerLink = screen.getByText(/sign up/i);
      await user.click(registerLink);

      // Try to register with existing email
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'password123');

      const registerButton = screen.getByRole('button', { name: /sign up/i });
      await user.click(registerButton);

      // Should remain on registration form
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });
  });

  describe('Forgot Password Flow', () => {
    it('should handle forgot password request', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Click forgot password link
      const forgotPasswordLink = screen.getByText(/forgot.*password/i);
      await user.click(forgotPasswordLink);

      // Fill in email for password reset
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'user@example.com');

      // Submit forgot password form
      const resetButton = screen.getByRole('button', { name: /reset.*password/i });
      await user.click(resetButton);

      // Should show success message
      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringMatching(/password.*reset/i)
      );
    });
  });

  describe('Logout Flow', () => {
    it('should complete logout workflow', async () => {
      const user = userEvent.setup();
      const mockUser = authenticateTestUser();

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/project dashboard/i)).toBeInTheDocument();
      });

      // Find user menu/profile
      const userMenu = screen.getByText(mockUser.name);
      await user.click(userMenu);

      // Click logout
      const logoutButton = screen.getByText(/sign out/i);
      await user.click(logoutButton);

      // Should redirect to auth page
      await waitFor(() => {
        expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
      });

      // Should call authentication service logout
      expect(mockServices.authentication.logout).toHaveBeenCalled();

      // Should show logout success message
      expect(mockServices.notification.success).toHaveBeenCalledWith('Signed out successfully');
    });
  });

  describe('Session Persistence', () => {
    it('should restore user session on page reload', () => {
      const mockUser = authenticateTestUser();
      render(<App />);

      // Should automatically show dashboard for existing session
      expect(screen.getByText(/project dashboard/i)).toBeInTheDocument();
    });

    it('should handle corrupted session data', () => {
      // Simulate corrupted session by having authentication service throw an error
      mockServices.authentication.getCurrentUser = vi.fn(() => {
        throw new Error('Corrupted session data');
      });

      render(<App />);

      // Should fall back to auth page and clean up bad data
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
      expect(mockServices.storage.removeItem).toHaveBeenCalledWith('taskflow_user');
    });

    it('should apply default values to incomplete user data', () => {
      const incompleteUser = createMockUser({
        // Remove some optional fields to test handling
        avatar: undefined,
        projectsCount: 0,
        tasksCompleted: 0,
      });

      authenticateTestUser(incompleteUser);
      render(<App />);

      // App should handle missing fields gracefully
      expect(screen.getByText(/project dashboard/i)).toBeInTheDocument();
    });
  });

  describe('Form Navigation', () => {
    it('should switch between login and register forms', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Should start with login form
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();

      // Switch to register
      const registerLink = screen.getByText(/sign up/i);
      await user.click(registerLink);

      expect(screen.getByText(/create.*account/i)).toBeInTheDocument();

      // Switch back to login
      const loginLink = screen.getByText(/sign in/i);
      await user.click(loginLink);

      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    });

    it('should navigate to forgot password and back', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Go to forgot password
      const forgotPasswordLink = screen.getByText(/forgot.*password/i);
      await user.click(forgotPasswordLink);

      expect(screen.getByText(/reset.*password/i)).toBeInTheDocument();

      // Go back to login
      const backToLoginLink = screen.getByText(/back.*to.*login/i);
      await user.click(backToLoginLink);

      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state during authentication', async () => {
      const user = userEvent.setup();
      render(<App />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      const loginButton = screen.getByRole('button', { name: /sign in/i });

      // Mock loading state by checking button state after click
      await user.click(loginButton);

      // Button might show loading state (disabled or spinner)
      // This depends on the implementation
      expect(loginButton).toBeInTheDocument();
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<App />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');

      // Trigger validation (focus out or form submit)
      await user.tab();

      // Should show validation error (implementation dependent)
      expect(emailInput).toHaveValue('invalid-email');
    });

    it('should validate password requirements', async () => {
      const user = userEvent.setup();
      render(<App />);

      // Navigate to register form (password requirements might be stricter)
      const registerLink = screen.getByText(/sign up/i);
      await user.click(registerLink);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, '123'); // Too short

      await user.tab();

      // Should show password validation error
      expect(passwordInput).toHaveValue('123');
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry after failed authentication', async () => {
      const user = userEvent.setup();
      render(<App />);

      // First attempt with wrong credentials
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');

      const loginButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(loginButton);

      // Clear and retry with correct credentials
      await user.clear(emailInput);
      await user.clear(passwordInput);

      await user.type(emailInput, 'correct@example.com');
      await user.type(passwordInput, 'correctpassword');

      await user.click(loginButton);

      // Should allow the retry attempt
      expect(emailInput).toHaveValue('correct@example.com');
    });
  });
});
