import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props  { children: ReactNode; }
interface State  { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
    window.location.href = "/";
  };

  render() {
    if (!this.state.error) return this.props.children;

    const msg = this.state.error.message ?? "Unknown error";

    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="card max-w-lg w-full p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red/10 border border-red/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">⚠</span>
          </div>

          <h1 className="font-display text-2xl font-bold text-text-1 mb-2">
            Something went wrong
          </h1>
          <p className="text-text-2 text-sm mb-6 leading-relaxed">
            An unexpected error occurred in the app.
            Your wallet and funds are safe — this is a UI error only.
          </p>

          <details className="mb-6 text-left">
            <summary className="text-text-3 text-xs font-mono cursor-pointer hover:text-text-2 transition-colors">
              Show error details
            </summary>
            <pre className="mt-2 bg-bg border border-border rounded-xl p-4 text-xs text-red font-mono overflow-auto max-h-32 leading-relaxed">
              {msg}
            </pre>
          </details>

          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="flex-1 py-2.5 rounded-xl bg-cyan text-bg text-sm font-semibold hover:bg-cyan-hover transition-colors"
            >
              ← Back to Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-2.5 rounded-xl border border-border-2 text-text-2 text-sm font-medium hover:text-text-1 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }
}