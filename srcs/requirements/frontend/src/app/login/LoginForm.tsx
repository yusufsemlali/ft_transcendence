"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import api from "@/lib/api/api";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/profile";
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = await login(email, password);

    if (result.success) {
      toast.success("Welcome back!");
      router.push(callbackUrl);
    } else {
      toast.error(result.error || "Login failed", {
        description: "Auth Error",
      });
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{ width: "100%", maxWidth: "320px" }}
    >
      <div className="section">
        <div className="section-header">
          <svg
            className="section-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3 3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
          <span className="section-title">login</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <button
          className="btn btn-secondary"
          style={{ 
            flex: 1, 
            justifyContent: "center", 
            fontWeight: "bold",
            letterSpacing: "-0.5px"
          }}
          onClick={async () => {
             try {
               const res = await api.auth.login42({});
               if (res.status === 200) {
                 window.location.href = res.body.url;
               } else {
                 toast.error("Failed to initiate 42 login");
               }
             } catch (error) {
               console.error("42 Login Error:", error);
               toast.error("An unexpected error occurred");
             }
          }}
          title="Login with 42"
        >
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/8/8d/42_Logo.svg" 
            alt="42 Login" 
            style={{ 
              width: "24px", 
              height: "24px",
              filter: "brightness(0) invert(1)" // To make it white if necessary
            }}
          />
        </button>
      </div>

      <div
        style={{
          textAlign: "center",
          marginBottom: "1.5rem",
          fontSize: "0.75rem",
          color: "var(--text-secondary)",
        }}
      >
        or
      </div>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="email"
            required
            className="input"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <input
            type="password"
            required
            className="input"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div
          style={{
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{ accentColor: "var(--accent-primary)" }}
          />
          <label
            htmlFor="rememberMe"
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            remember me
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
        >
          {isLoading ? (
            <>
              <span
                className="material-symbols-outlined"
                style={{ animation: "spin 1s linear infinite" }}
              >
                progress_activity
              </span>
              signing in...
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3 3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              sign in
            </>
          )}
        </button>

        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <button
            type="button"
            style={{
              fontSize: "0.75rem",
              color: "var(--accent-primary)",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            forgot password?
          </button>
        </div>
      </form>
    </div>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
