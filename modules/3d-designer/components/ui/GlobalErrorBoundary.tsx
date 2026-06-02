'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

/**
 * Global Error Boundary Component
 *
 * Catches and handles errors throughout the application with user-friendly
 * error messages, recovery options, and error reporting.
 */
export class GlobalErrorBoundary extends Component<Props, State> {
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
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('Global Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
    });

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // reportError({
      //   message: error.message,
      //   stack: error.stack,
      //   componentStack: errorInfo.componentStack,
      //   errorId: this.state.errorId,
      //   userAgent: navigator.userAgent,
      //   url: window.location.href,
      // });
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportBug = () => {
    const subject = encodeURIComponent('VoiceForge 3D Error Report');
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Error: ${this.state.error?.message}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
[Your description here]
    `);

    window.open(`mailto:support@voiceforge3d.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card border border-destructive/20 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
                <p className="text-sm text-muted-foreground">An unexpected error occurred</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Error Details:</p>
                <p className="font-mono text-xs bg-muted p-2 rounded break-all">
                  {this.state.error?.message || 'Unknown error'}
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Show technical details
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32 font-mono">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              {this.state.errorId && (
                <div className="text-xs text-muted-foreground">
                  Error ID: <code className="font-mono">{this.state.errorId}</code>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={this.handleReload}
                className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full px-3 py-2 bg-secondary text-secondary-foreground border border-border rounded-md hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>

              <button
                onClick={this.handleReportBug}
                className="w-full px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Bug className="w-4 h-4" />
                Report Bug
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground text-center">
              If this problem persists, please contact support with the error ID above.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
