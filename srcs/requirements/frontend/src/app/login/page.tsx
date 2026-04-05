"use client";

import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default function LoginPage() {
    return (
        <div style={{
            minHeight: "100vh",
            padding: "40px 20px",
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
            backgroundColor: "transparent",
        }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                <header style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    marginBottom: "48px",
                    flexWrap: "wrap",
                    gap: "20px",
                    borderBottom: "1px solid var(--border-color)",
                    paddingBottom: "24px"
                }}>
                    <h1 style={{ fontSize: "36px", fontWeight: "300", margin: 0 }}>
                        Authentication Hub
                    </h1>
                    <div className="glass" style={{
                        padding: "4px 12px",
                        borderRadius: "24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        border: "1px solid var(--border-color)",
                    }}>
                        <span className="material-symbols-outlined" style={{ color: "var(--text-muted)", fontSize: "18px" }}>lock</span>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Secure Gateway</span>
                    </div>
                </header>

                <main 
                  className="animate-fade-in" 
                  style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", 
                    gap: "40px",
                    alignItems: "start" 
                  }}
                >
                    <div className="stack-xl">
                        <div style={{ maxWidth: "450px" }}>
                            <h2 className="text-gradient" style={{ fontSize: "48px", fontWeight: "700", lineHeight: "1.1", marginBottom: "24px" }}>
                                Join the Arena.
                            </h2>
                            <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", lineHeight: "1.6" }}>
                                Create an account to track your stats, join tournaments, and climb the global leaderboards.
                            </p>
                        </div>
                        <RegisterForm />
                    </div>

                    <div className="stack-xl">
                        <div style={{ maxWidth: "450px" }}>
                            <h2 style={{ fontSize: "24px", fontWeight: "300", color: "var(--text-secondary)", marginBottom: "24px" }}>
                                Welcome back, Commander.
                            </h2>
                        </div>
                        <LoginForm />
                    </div>
                </main>
            </div>
        </div>
    );
}
