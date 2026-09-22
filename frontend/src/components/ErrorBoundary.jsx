import React from "react";

// Wraps the app so that if ANY screen throws during render, we show the
// actual error instead of an unstyled blank white page (React unmounts the
// whole tree on an uncaught render error otherwise).
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Still goes to the browser console / Vercel runtime logs.
    console.error("[ORCA] render error:", error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            fontFamily: "Inter, system-ui, sans-serif",
            background: "#0B3C61",
            color: "#fff",
            textAlign: "left",
          }}
        >
          <div style={{ maxWidth: 640 }}>
            <h1 style={{ fontSize: 18, marginBottom: 12 }}>
              ORCA hit a rendering error
            </h1>
            <p style={{ opacity: 0.85, marginBottom: 12 }}>
              This replaces what would otherwise be a blank screen. The
              details below are also in the browser console (F12).
            </p>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                background: "rgba(0,0,0,0.35)",
                padding: 12,
                borderRadius: 8,
                fontSize: 12,
                overflow: "auto",
              }}
            >
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
