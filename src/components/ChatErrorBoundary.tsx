'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ChatErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chat Error Boundary caught an error:', error, errorInfo);

    // Log to localStorage for debugging
    const logs = JSON.parse(localStorage.getItem('chat_errors') || '[]');
    logs.push({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('chat_errors', JSON.stringify(logs.slice(-10)));
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    // Clear potentially corrupted chat data
    const userId = localStorage.getItem('dpa_session');
    if (userId) {
      try {
        const session = JSON.parse(userId);
        localStorage.removeItem(`chat_${session.userId}`);
      } catch {}
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: '380px',
            maxWidth: 'calc(100vw - 2rem)',
            padding: '1.5rem',
            background: 'rgba(17, 24, 39, 0.95)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '1rem',
            boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
            zIndex: 100,
          }}
        >
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#ef4444' }}>
              ⚠️ Chat Error
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>
              The chat encountered an error. This might be due to corrupted data or a temporary issue.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={this.handleReset}
              className="btn-primary"
              style={{ flex: 1, padding: '0.75rem' }}
            >
              Reset Chat
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-ghost"
              style={{ flex: 1, padding: '0.75rem' }}
            >
              Reload Page
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-muted)' }}>
              <summary style={{ cursor: 'pointer' }}>Error Details</summary>
              <pre style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', overflow: 'auto', maxHeight: '200px' }}>
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
