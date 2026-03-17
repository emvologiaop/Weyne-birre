import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = this.state.error?.message || 'An unexpected error occurred';
      let isFirestoreError = false;
      
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed.error && parsed.operationType) {
          isFirestoreError = true;
          errorMessage = `Database Error: ${parsed.error} (Operation: ${parsed.operationType} on ${parsed.path})`;
        }
      } catch (e) {
        // Not a JSON error string
      }

      return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#141414] border border-rose-500/20 rounded-3xl p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
            <p className="text-sm text-white/60">
              {isFirestoreError 
                ? "We encountered an issue communicating with the database. This might be a permissions issue or a network error."
                : "The application encountered an unexpected error."}
            </p>
            <div className="p-4 bg-black/50 rounded-xl text-left overflow-auto max-h-48 mt-4">
              <code className="text-xs text-rose-400 font-mono break-words">
                {errorMessage}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full py-3 px-4 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
