"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await api.auth.login({
                body: { email, password }
            });

            if (response.status === 200) {
                localStorage.setItem("token", response.body.token);
                router.push("/");
            } else {
                if ('message' in response.body) {
                    setError(response.body.message);
                } else {
                    setError("Login failed");
                }
            }
        } catch (err) {
            setError("An unexpected error occurred");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Minimal nav */}
            <nav className="nav">
                <Link href="/" className="nav-logo">
                    <span className="nav-logo-icon">⊞</span>
                    <span>tournify</span>
                </Link>
            </nav>

            {/* Login form */}
            <main className="flex-1 flex items-center justify-center">
                <div className="animate-fade-in" style={{ width: "100%", maxWidth: "320px" }}>
                    <div className="section">
                        <div className="section-header">
                            <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="section-title">sign in</span>
                        </div>
                        <p className="section-description">
                            welcome back to tournify
                        </p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                                email
                            </label>
                            <input
                                type="email"
                                required
                                className="input"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                                password
                            </label>
                            <input
                                type="password"
                                required
                                className="input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div style={{
                                padding: "0.75rem",
                                marginBottom: "1rem",
                                fontSize: "0.8rem",
                                color: "var(--accent-error)",
                                background: "rgba(202, 71, 84, 0.1)",
                                borderRadius: "6px"
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ width: "100%", justifyContent: "center" }}
                        >
                            {loading ? "signing in..." : "sign in"}
                        </button>

                        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                don't have an account?{" "}
                                <Link href="/register" style={{ color: "var(--accent-primary)" }}>
                                    register
                                </Link>
                            </p>
                        </div>
                    </form>

                    <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-color)" }}>
                        <button className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            continue with github
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
