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
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "monospace",
            backgroundColor: "#000",
            color: "#fff",
          }}
        >
          <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
            Critical Error
          </h2>
          <p style={{ marginBottom: "2rem", opacity: 0.7 }}>
            Something went wrong at the system level.
            <br />
            <span style={{ fontSize: "0.8rem", color: "#f87171" }}>
              {error.message || "Unknown error"}
            </span>
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.8rem 2rem",
              background: "#fff",
              color: "#000",
              border: "none",
              borderRadius: "50px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "bold",
            }}
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
