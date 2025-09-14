import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { ServiceProvider } from '@/services/context/ServiceContext';
import { AuthProvider } from './AuthProvider';
import { ServiceContainer } from '@/services/container/ServiceContainer';
import { ServiceRegistry } from '@/services/ServiceRegistry';

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

// Create and configure service container
const serviceContainer = new ServiceContainer();
ServiceRegistry.registerServices(serviceContainer);

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Root application providers component
 * Wraps the app with all necessary providers and context
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ServiceProvider container={serviceContainer}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            {children}
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ServiceProvider>
  );
};
