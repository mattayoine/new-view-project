
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, Bug, Mail, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableReporting?: boolean;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private readonly maxRetries = 3;

  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true, 
      error,
      errorId
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    };

    // Log error to console
    console.error('Error caught by boundary:', errorDetails);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Store error details for potential reporting
    this.setState({ errorInfo });

    // Send error to monitoring service (in production)
    if (this.props.enableReporting) {
      this.reportError(errorDetails);
    }
  }

  private reportError = async (errorDetails: any) => {
    try {
      // In production, send to error reporting service
      console.log('Reporting error to service:', errorDetails);
      
      // You could send to Sentry, LogRocket, etc.
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorDetails)
      // });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
      toast.success(`Retrying... (${this.retryCount}/${this.maxRetries})`);
    } else {
      toast.error('Maximum retry attempts reached');
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private copyErrorDetails = () => {
    const errorText = JSON.stringify({
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      errorId: this.state.errorId
    }, null, 2);
    
    navigator.clipboard.writeText(errorText).then(() => {
      toast.success('Error details copied to clipboard');
    });
  };

  private getErrorSeverity = (error: Error): 'low' | 'medium' | 'high' | 'critical' => {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'medium';
    }
    
    if (errorMessage.includes('auth') || errorMessage.includes('permission')) {
      return 'high';
    }
    
    if (errorMessage.includes('database') || errorMessage.includes('server')) {
      return 'critical';
    }
    
    return 'low';
  };

  private getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const severity = this.state.error ? this.getErrorSeverity(this.state.error) : 'low';
      const canRetry = this.retryCount < this.maxRetries;

      return (
        <Card className="w-full max-w-2xl mx-auto mt-8 border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Something went wrong
              <Badge className={this.getSeverityColor(severity)}>
                {severity.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              An unexpected error occurred. Our team has been notified and is working on a fix.
            </p>

            {this.state.errorId && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bug className="w-4 h-4" />
                Error ID: <code className="bg-muted px-1 rounded">{this.state.errorId}</code>
              </div>
            )}

            {this.props.showDetails && this.state.error && (
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground mb-2">
                  Technical Details
                </summary>
                <div className="space-y-2">
                  <div>
                    <strong>Error:</strong>
                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-wrap gap-2">
              {canRetry && (
                <Button onClick={this.handleRetry} variant="default">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again ({this.maxRetries - this.retryCount} left)
                </Button>
              )}
              
              <Button onClick={this.handleReload} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>

              {this.state.error && (
                <Button onClick={this.copyErrorDetails} variant="outline" size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Details
                </Button>
              )}

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('mailto:support@example.com?subject=Error Report&body=' + encodeURIComponent(`Error ID: ${this.state.errorId}\nError: ${this.state.error?.message}`))}
              >
                <Mail className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  return (props: P) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </EnhancedErrorBoundary>
  );
};
