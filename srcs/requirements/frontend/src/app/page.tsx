"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <>
      <main className="hero animate-fade-in" style={{ padding: "1rem" }}>
        <div className="glass-card" style={{
          padding: "4rem 3rem",
          textAlign: "center",
          maxWidth: "800px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2rem"
        }}>
          {/* Gradient Trophy Icon */}
          <div style={{
            fontSize: "5rem",
            marginBottom: "0.5rem",
            background: "var(--gradient-prism)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "inherit" }}>trophy</span>
          </div>

          <div>
            <h1 className="hero-title text-gradient" style={{ fontWeight: 700, letterSpacing: "-0.05em", marginBottom: "0.5rem" }}>
              PRISM TOURNAMENTS
            </h1>
            <p className="hero-subtitle" style={{ maxWidth: "600px", margin: "0 auto", fontSize: "1.1rem" }}>
              Create brackets, manage competitions, and track leaderboards with a modern, fluid experience.
            </p>
          </div>

          <div className="hero-actions" style={{ marginTop: "1rem" }}>
            {isAuthenticated ? (
              <Link href="/tournaments/create" className="btn btn-primary" style={{ padding: "0.8rem 2rem", fontSize: "1rem", borderRadius: "50px" }}>
                New Tournament
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary" style={{ padding: "0.8rem 2rem", fontSize: "1rem", borderRadius: "50px" }}>
                Get Started
              </Link>
            )}
            <Link href="/tournaments" className="btn btn-secondary" style={{ padding: "0.8rem 2rem", fontSize: "1rem", borderRadius: "50px" }}>
              Browse Events
            </Link>
          </div>

          <div className="hero-stats" style={{
            marginTop: "2rem",
            paddingTop: "2rem",
            borderTop: "1px solid var(--border-color)",
            width: "100%",
            justifyContent: "space-around",
            gap: "1rem"
          }}>
            <div>
              <div className="stat-value" style={{ fontSize: "1.5rem", fontWeight: 700 }}>1,247</div>
              <div className="stat-label">Events</div>
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: "1.5rem", fontWeight: 700 }}>42.5k</div>
              <div className="stat-label">Players</div>
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: "1.5rem", fontWeight: 700 }}>8.2k</div>
              <div className="stat-label">Communities</div>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <Link href="/contact" className="footer-link">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          contact
        </Link>
        <Link href="/support" className="footer-link">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          support
        </Link>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link">
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
          github
        </a>
        <Link href="/terms" className="footer-link">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          terms
        </Link>
        <Link href="/privacy" className="footer-link">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          privacy
        </Link>
      </footer>
    </>
  );
}
