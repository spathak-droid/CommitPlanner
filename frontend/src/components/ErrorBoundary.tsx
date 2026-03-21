import React from 'react';

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface px-6">
          <div className="max-w-lg rounded-[1.5rem] bg-surface-lowest p-8 text-center shadow-[0px_24px_48px_rgba(27,27,30,0.06)] ring-1 ring-outline-variant/10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-error">Module Error</p>
            <h1 className="font-display mt-3 text-3xl font-black tracking-tight text-on-surface">Weekly Commit module failed to load</h1>
            <p className="mt-3 text-sm leading-6 text-secondary">
              Refresh the page or reopen the module from the host app. If the problem continues, check the remote entry and API availability.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
