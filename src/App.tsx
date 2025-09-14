import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from './store';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { initializeAuth, selectUser, selectAuthLoading, selectIsAuthenticated } from './store/slices/authSlice';
import { AuthPage } from './components/auth/AuthPage';
import { UserProfile } from './components/profile/UserProfile';
import { Header } from './components/layout/Header';
import { ProjectDashboardContainer } from './containers/ProjectDashboardContainer';
import { SkipLinks } from './components/accessibility/SkipLinks';
import { ErrorBoundary } from './components/error/ErrorBoundary';
import { ServiceProvider, useServices } from './services/context/ServiceContext';
import { getConfiguredContainer } from './services/setup';
import type { User } from './types';

const queryClient = new QueryClient();
const serviceContainer = getConfiguredContainer();

// Main App Content Component (with Redux integration)
const AppContent = ({ skipInitialization }: { skipInitialization?: boolean } = {}) => {
  const services = useServices();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const authLoading = useAppSelector(selectAuthLoading);
  const [showProfile, setShowProfile] = useState(false);

  // Initialize Redux auth state on app load (can be skipped for tests)
  useEffect(() => {
    if (!skipInitialization) {
      dispatch(initializeAuth());
    }
  }, [dispatch, skipInitialization]);

  const handleAuthSuccess = async (userData: User) => {
    try {
      // Redux will handle the state update automatically through the auth slice
      services.notification.success('Welcome back!');
    } catch (error: unknown) {
      console.error('Authentication error:', error);
      services.notification.error('Authentication failed');
    }
  };

  const handleLogout = async () => {
    try {
      await services.auth.logout();
      // Redux will handle the state update automatically through the auth slice
      services.notification.success('Signed out successfully');
    } catch (error: unknown) {
      console.error('Logout error:', error);
      services.notification.error('Logout failed');
    }
  };

  const handleUserUpdate = async (updatedUser: User) => {
    try {
      const updated = await services.auth.updateProfile(updatedUser.id, updatedUser);
      // Redux will handle the state update automatically through the auth slice
      services.notification.success('Profile updated successfully');
    } catch (error: unknown) {
      console.error('Profile update error:', error);
      services.notification.error('Failed to update profile');
    }
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show auth page if user is not logged in
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background">
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  // Show main application
  return (
    <div className="min-h-screen bg-background">
      <SkipLinks />
      {/* Profile Modal */}
      {showProfile && (
        <aside
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
          role="dialog"
          aria-modal="true"
          aria-label="User profile settings"
        >
          <UserProfile
            user={user}
            onUserUpdate={handleUserUpdate}
            onClose={() => setShowProfile(false)}
          />
        </aside>
      )}

      {/* Main Application */}
      <Header
        user={user}
        onProfileClick={() => setShowProfile(true)}
        onLogout={handleLogout}
      />
      <main id="main-content" role="main" aria-label="Project dashboard" tabIndex={-1}>
        <ProjectDashboardContainer />
      </main>
    </div>
  );
};

// Root App Component (provides Redux store and services)
const App = ({ skipInitialization }: { skipInitialization?: boolean } = {}) => {
  return (
    <ErrorBoundary level="critical">
      <Provider store={store}>
        <ServiceProvider container={serviceContainer}>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <ErrorBoundary level="page">
                <AppContent skipInitialization={skipInitialization} />
              </ErrorBoundary>
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </QueryClientProvider>
        </ServiceProvider>
      </Provider>
    </ErrorBoundary>
  );
};

// Export a test-friendly version that doesn't auto-initialize auth
export const TestApp = () => <App skipInitialization={true} />;
export { AppContent }; // Export for granular testing

export default App;