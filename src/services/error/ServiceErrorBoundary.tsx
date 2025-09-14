import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ServiceContainer } from '../container/ServiceContainer';

interface Props {
    children: ReactNode;
    container: ServiceContainer;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    serviceErrors: Map<string, Error>;
}

/**
 * Error boundary specifically for service container failures
 * Handles service initialization and resolution errors
 */
export class ServiceErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            serviceErrors: new Map(),
        };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
            serviceErrors: new Map(),
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log the error to the console and any available logging service
        console.error('Service Error Boundary caught an error:', error, errorInfo);

        // Try to log to the service if available
        try {
            const logger = this.props.container.tryResolve('ILoggerService');
            if (logger) {
                logger.error('Service Error Boundary caught an error', error, {
                    componentStack: errorInfo.componentStack,
                    serviceErrors: Array.from(this.state.serviceErrors.entries()),
                });
            }
        } catch (loggingError) {
            console.error('Failed to log service error:', loggingError);
        }
    }

    /**
     * Handle service resolution errors
     */
    handleServiceError = (serviceToken: string, error: Error) => {
        this.setState(prevState => {
            const newServiceErrors = new Map(prevState.serviceErrors);
            newServiceErrors.set(serviceToken, error);

            return {
                hasError: true,
                error: new Error(`Service resolution failed: ${serviceToken}`),
                serviceErrors: newServiceErrors,
            };
        });
    };

    /**
     * Reset the error boundary
     */
    resetError = () => {
        this.setState({
            hasError: false,
            error: undefined,
            serviceErrors: new Map(),
        });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                            <svg
                                className="w-6 h-6 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                            </svg>
                        </div>

                        <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
                            Service Error
                        </h2>

                        <p className="text-sm text-gray-600 text-center mb-4">
                            {this.state.error?.message || 'An error occurred while initializing services'}
                        </p>

                        {this.state.serviceErrors.size > 0 && (
                            <div className="mb-4">
                                <h3 className="text-sm font-medium text-gray-900 mb-2">Failed Services:</h3>
                                <ul className="text-xs text-gray-600 space-y-1">
                                    {Array.from(this.state.serviceErrors.entries()).map(([token, error]) => (
                                        <li key={token} className="flex justify-between">
                                            <span className="font-mono">{token}</span>
                                            <span className="text-red-600">{error.message}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex space-x-3">
                            <button
                                onClick={this.resetError}
                                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Try Again
                            </button>

                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Higher-order component to wrap components with service error boundary
 */
export const withServiceErrorBoundary = <P extends object>(
    Component: React.ComponentType<P>,
    container: ServiceContainer,
    fallback?: ReactNode
) => {
    return (props: P) => (
        <ServiceErrorBoundary container={container} fallback={fallback}>
            <Component {...props} />
        </ServiceErrorBoundary>
    );
};
