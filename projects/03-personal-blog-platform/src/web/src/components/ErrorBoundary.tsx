import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            style={{
              padding: "2rem",
              color: "tomato",
              fontFamily: "monospace",
              background: "var(--bg, #0a0a0a)",
              minHeight: "100vh",
            }}
          >
            <h2 style={{ marginBottom: "0.5rem" }}>頁面發生錯誤</h2>
            <pre style={{ fontSize: "0.75rem", whiteSpace: "pre-wrap" }}>
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                marginTop: "1rem",
                padding: "0.4rem 1rem",
                background: "var(--green, #22c55e)",
                color: "#000",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              重試
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
