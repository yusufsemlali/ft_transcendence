"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        height: "100%",
        padding: "2rem",
        textAlign: "center",
        fontFamily: "var(--font-mono, monospace)",
      }}
    >
      <div
        style={{
          fontSize: "4rem",
          color: "var(--destructive, #f87171)",
          marginBottom: "1rem",
        }}
      >
        !
      </div>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
        Something went wrong!
      </h2>
      <p
        style={{
          color: "var(--text-secondary, #a1a1aa)",
          marginBottom: "2rem",
        }}
      >
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
        className="btn btn-secondary"
        style={{
          padding: "0.5rem 1.5rem",
          borderRadius: "8px",
          backgroundColor: "var(--bg-secondary, #333)",
          color: "var(--text-primary, #fff)",
          border: "none",
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
