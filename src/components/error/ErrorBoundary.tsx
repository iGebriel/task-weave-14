import React, { Component, ReactNode } from 'react';
import { ILoggerService, INotificationService, SERVICE_TOKENS } from '@/services/interfaces';
import { ErrorFallback } from './ErrorFallback';
import { ErrorInfo } from './ErrorInfo';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  loggerService?: ILoggerService;
  notificationService?: INotificationService;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
}

export interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
  onRetry: () => void;
  onReport: () => void;
  level: string;
}

/**
 * Global error boundary that integrates with our service layer
 * Provides different fallback UIs based on error severity
 */
export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError, loggerService, notificationService, level = 'component' } = this.props;
    const errorId = this.state.errorId || `error_${Date.now()}`;

    // Update state with error info
    this.setState({ errorInfo });

    // Log the error using the logger service
    if (loggerService) {
      loggerService.error(`[ErrorBoundary:${level}] Component error caught`, error, {
        errorId,
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        level,
      });
    } else {
      console.error('[ErrorBoundary] Error caught:', error, errorInfo);
    }

    // Show user notification for critical errors
    if (level === 'critical' && notificationService) {
      notificationService.error('A critical error occurred. Please refresh the page.');
    } else if (level === 'page' && notificationService) {
      notificationService.error('Something went wrong. Please try again.');
    }

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }

    // Report to error tracking service
    this.reportError(error, errorInfo, errorId);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private reportError = async (error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    try {
      // In a real app, this would send to an error tracking service like Sentry
      const errorReport = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        level: this.props.level || 'component',
      };

      // Mock error reporting - replace with actual service
      console.info('[ErrorBoundary] Error reported:', errorReport);
      
      // Could integrate with analytics service here
      // this.props.analyticsService?.track('error_boundary_triggered', errorReport);
    } catch (reportingError) {
      console.error('[ErrorBoundary] Failed to report error:', reportingError);
    }
  };

  private handleRetry = () => {
    const { notificationService } = this.props;
    
    if (notificationService) {
      notificationService.info('Retrying...');
    }

    // Clear error state after a short delay to allow for cleanup
    this.retryTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
      });
    }, 100);
  };

  private handleReport = () => {
    const { error, errorInfo, errorId } = this.state;
    const { notificationService } = this.props;

    if (error && errorInfo && errorId) {
      this.reportError(error, errorInfo, errorId);
      
      if (notificationService) {
        notificationService.success('Error report sent. Thank you for helping us improve!');
      }
    }
  };

  render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback: CustomFallback, level = 'component' } = this.props;

    if (hasError) {
      const fallbackProps: ErrorFallbackProps = {
        error,
        errorInfo,
        errorId,
        onRetry: this.handleRetry,
        onReport: this.handleReport,
        level,
      };

      // Use custom fallback or default based on error level
      if (CustomFallback) {
        return <CustomFallback {...fallbackProps} />;
      }

      // Default fallback UI based on level
      return <ErrorFallback {...fallbackProps} />;
    }

    return children;
  }
}

// HOC for wrapping components with error boundaries
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

// Hook for components to trigger error boundaries
export const useErrorHandler = () => {
  const [, setState] = React.useState();

  return React.useCallback((error: Error) => {
    setState(() => {
      throw error;
    });
  }, []);
};
