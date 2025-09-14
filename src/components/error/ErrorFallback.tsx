import React from 'react';
import { AlertTriangle, RefreshCw, Bug, Home, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ErrorFallbackProps } from './ErrorBoundary';

/**
 * Default error fallback component with different UIs based on error level
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  errorId,
  onRetry,
  onReport,
  level,
}) => {
  const [showDetails, setShowDetails] = React.useState(false);
  
  // Different UI variants based on error severity
  const getErrorConfig = () => {
    switch (level) {
      case 'critical':
        return {
          icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
          title: 'Critical Error',
          description: 'The application encountered a critical error and cannot continue.',
          variant: 'destructive' as const,
          showRetry: false,
          showHome: true,
        };
      case 'page':
        return {
          icon: <AlertTriangle className="h-10 w-10 text-orange-500" />,
          title: 'Page Error',
          description: 'This page encountered an error and could not load properly.',
          variant: 'secondary' as const,
          showRetry: true,
          showHome: true,
        };
      default:
        return {
          icon: <Bug className="h-8 w-8 text-yellow-500" />,
          title: 'Component Error',
          description: 'A component on this page encountered an error.',
          variant: 'outline' as const,
          showRetry: true,
          showHome: false,
        };
    }
  };

  const config = getErrorConfig();

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {config.icon}
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            {config.title}
            <Badge variant={config.variant}>{level}</Badge>
          </CardTitle>
          <CardDescription>
            {config.description}
          </CardDescription>
          {errorId && (
            <div className="text-xs text-muted-foreground mt-2">
              Error ID: <code className="bg-muted px-1 py-0.5 rounded">{errorId}</code>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium text-foreground mb-1">Error Message:</p>
              <p className="text-sm text-muted-foreground font-mono">{error.message}</p>
            </div>
          )}

          {/* Collapsible error details for debugging */}
          <Collapsible open={showDetails} onOpenChange={setShowDetails}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full">
                {showDetails ? 'Hide' : 'Show'} Technical Details
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              {error?.stack && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-xs font-medium text-foreground mb-2">Stack Trace:</p>
                  <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </div>
              )}
              
              {errorInfo?.componentStack && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-xs font-medium text-foreground mb-2">Component Stack:</p>
                  <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
              
              <div className="bg-muted p-3 rounded-md">
                <p className="text-xs font-medium text-foreground mb-2">Debug Information:</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>URL:</strong> {window.location.href}</p>
                  <p><strong>User Agent:</strong> {navigator.userAgent}</p>
                  <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2 justify-center">
            {config.showRetry && (
              <Button onClick={onRetry} variant="default" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            
            {config.showHome && (
              <Button onClick={handleGoHome} variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            )}
            
            {level === 'critical' && (
              <Button onClick={handleReload} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </Button>
            )}
            
            <Button onClick={onReport} variant="ghost" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            If this problem persists, please contact support with the error ID above.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

/**
 * Minimal error fallback for small components
 */
export const MinimalErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorId,
  onRetry,
  level,
}) => (
  <div className="flex items-center justify-center p-4 bg-muted/50 rounded-md border border-dashed">
    <div className="text-center space-y-2">
      <Bug className="h-6 w-6 text-muted-foreground mx-auto" />
      <div>
        <p className="text-sm font-medium">Component Error</p>
        <p className="text-xs text-muted-foreground">
          {error?.message || 'Something went wrong'}
        </p>
        {errorId && (
          <p className="text-xs text-muted-foreground mt-1">ID: {errorId}</p>
        )}
      </div>
      <Button onClick={onRetry} variant="outline" size="sm">
        <RefreshCw className="h-3 w-3 mr-1" />
        Retry
      </Button>
    </div>
  </div>
);

/**
 * Inline error fallback for small UI elements
 */
export const InlineErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  onRetry,
}) => (
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <AlertTriangle className="h-4 w-4 text-orange-500" />
    <span>{error?.message || 'Error occurred'}</span>
    <Button onClick={onRetry} variant="ghost" size="sm" className="h-6 px-2">
      Retry
    </Button>
  </div>
);
