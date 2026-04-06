"use client";

import { useState, useRef, Suspense } from "react";
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

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const clearValidity = (ref: React.RefObject<HTMLInputElement | null>) => {
    ref.current?.setCustomValidity("");
  };

  const showFieldError = (ref: React.RefObject<HTMLInputElement | null>, message: string) => {
    if (ref.current) {
      ref.current.setCustomValidity(message);
      requestAnimationFrame(() => {
        ref.current?.reportValidity();
      });
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = await login(email, password);

    if (result.success) {
      toast.success("Welcome back!");
      router.push(callbackUrl);
    } else {
      const errorMsg = result.error || "Login failed";
      if (errorMsg.toLowerCase().includes("credentials") || errorMsg.toLowerCase().includes("password")) {
        showFieldError(passwordRef, errorMsg);
      } else {
        showFieldError(emailRef, errorMsg);
      }
    }
  };

  return (
    <div className="glass-card animate-fade-in" style={{ padding: "32px", border: "1px solid var(--border-color)", maxWidth: "450px" }}>
      <div className="section-header" style={{ marginBottom: "24px" }}>
        <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3 3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        <span className="section-title">SIGN IN</span>
      </div>

      <p className="section-description" style={{ marginBottom: "24px", fontSize: "0.8rem" }}>
        Enter your credentials to access your account dashboard.
      </p>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <button
          className="btn btn-secondary"
          style={{ flex: 1, justifyContent: "center", borderRadius: "10px" }}
          onClick={async () => {
             try {
               const res = await api.auth.login42({});
               if (res.status === 200) {
                 window.location.href = res.body.url;
               } else {
                 toast.error("Failed to initiate 42 login");
               }
             } catch (error) {
               toast.error("An unexpected error occurred");
             }
          }}
        >
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/8/8d/42_Logo.svg" 
            alt="42 Login" 
            style={{ width: "22px", height: "22px", filter: "brightness(0) invert(1)" }}
          />
          <span style={{ fontSize: "0.75rem", fontWeight: "600", letterSpacing: "1px" }}>LOGIN WITH 42</span>
        </button>
      </div>

      <div style={{ textAlign: "center", marginBottom: "1.5rem", fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "1px" }}>OR</div>

      <form onSubmit={handleLogin} className="stack-md">
        <div>
          <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>EMAIL ADDRESS</label>
          <input
            ref={emailRef}
            type="email"
            required
            className="input"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearValidity(emailRef); }}
            disabled={isLoading}
          />
        </div>

        <div>
          <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>PASSWORD</label>
          <input
            ref={passwordRef}
            type="password"
            required
            className="input"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearValidity(passwordRef); }}
            disabled={isLoading}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1rem" }}>
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{ accentColor: "var(--primary)" }}
          />
          <label htmlFor="rememberMe" style={{ fontSize: "0.7rem", color: "var(--text-secondary)", cursor: "pointer" }}>REMEMBER SESSION</label>
        </div>

        <div style={{ marginTop: "24px" }}>
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "10px 24px" }}
          >
            {isLoading ? "Signing in..." : "SIGN IN"}
            <span className="material-symbols-outlined" style={{ fontSize: "16px", marginLeft: "8px" }}>login</span>
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <button type="button" style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            forgot password?
          </button>
        </div>
      </form>
    </div>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
