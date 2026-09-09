"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled Application Error:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0a0a0a",
      color: "#e0e0e0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      fontFamily: "Inter, sans-serif",
      textAlign: "center"
    }}>
      <div style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(0, 229, 255, 0.2)",
        borderRadius: "12px",
        padding: "2.5rem 2rem",
        maxWidth: "480px",
        width: "100%",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)"
      }}>
        <h2 style={{
          color: "#00e5ff",
          fontSize: "1.5rem",
          fontWeight: 700,
          letterSpacing: "1px",
          marginBottom: "1rem"
        }}>
          Something Went Wrong
        </h2>
        <p style={{
          color: "#aaa",
          fontSize: "0.95rem",
          lineHeight: 1.6,
          marginBottom: "1.5rem"
        }}>
          An unexpected error occurred while rendering this page. Our team has been notified.
        </p>
        <button
          onClick={() => reset()}
          style={{
            background: "linear-gradient(135deg, #00e5ff, #0088ff)",
            color: "#000",
            border: "none",
            borderRadius: "6px",
            padding: "0.75rem 1.75rem",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
