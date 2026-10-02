'use client';

import React from 'react';
import { AlertIcon } from './icons';

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
        <div className="glass-card"
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            width: '380px',
            maxWidth: 'calc(100vw - 2rem)',
            padding: '1.5rem',
            zIndex: 100,
          }}
        >
          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: '#fdecea', color: 'var(--color-danger)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertIcon size={18} />
            </span>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Chat ran into a problem
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', lineHeight: 1.55 }}>
                This is usually caused by corrupted local data or a temporary issue.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={this.handleReset}
              className="btn-primary"
              style={{ flex: 1, padding: '0.7rem' }}
            >
              Reset chat
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
              style={{ flex: 1, padding: '0.7rem' }}
            >
              Reload page
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-muted)' }}>
              <summary style={{ cursor: 'pointer' }}>Error details</summary>
              <pre style={{ marginTop: '0.5rem', padding: '0.6rem', background: 'var(--color-surface2)', border: '1px solid var(--color-border)', borderRadius: '6px', overflow: 'auto', maxHeight: '200px', fontSize: '0.7rem' }}>
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
