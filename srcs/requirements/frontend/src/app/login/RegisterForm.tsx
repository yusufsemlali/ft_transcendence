"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/hooks";
import { toast } from "@/components/ui/sonner";

export default function RegisterForm() {
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");

  const usernameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const verifyEmailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const verifyPasswordRef = useRef<HTMLInputElement>(null);

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

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (email !== verifyEmail) {
      showFieldError(verifyEmailRef, "Emails do not match");
      return;
    }

    if (password !== verifyPassword) {
      showFieldError(verifyPasswordRef, "Passwords do not match");
      return;
    }

    if (password.length < 8) {
      showFieldError(passwordRef, "Password must be at least 8 characters");
      return;
    }

    const result = await register(email, username, password);

    if (result.success) {
      toast.success("Account created successfully!");
      router.push("/profile");
    } else {
      const errorMsg = result.error || "Registration failed";

      if (result.validationErrors && result.validationErrors.length > 0) {
        for (const err of result.validationErrors) {
          const field = err.path?.[0];
          const msg = err.message || "Invalid value";
          if (field === "username") { showFieldError(usernameRef, msg); return; }
          if (field === "email") { showFieldError(emailRef, msg); return; }
          if (field === "password") { showFieldError(passwordRef, msg); return; }
        }
      }

      const lower = errorMsg.toLowerCase();
      if (lower.includes("email")) {
        showFieldError(emailRef, errorMsg);
      } else if (lower.includes("username")) {
        showFieldError(usernameRef, errorMsg);
      } else {
        showFieldError(usernameRef, errorMsg);
      }
    }
  };

  return (
    <div className="glass-card animate-fade-in" style={{ padding: "32px", border: "1px solid var(--border-color)", maxWidth: "450px" }}>
      <div className="section-header" style={{ marginBottom: "24px" }}>
        <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        <span className="section-title">CREATE ACCOUNT</span>
      </div>

      <p className="section-description" style={{ marginBottom: "24px", fontSize: "0.8rem" }}>
        Enter your details below to create your account and start your journey.
      </p>

      <form onSubmit={handleRegister} className="stack-md">
        <div>
          <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>USERNAME</label>
          <input
            ref={usernameRef}
            type="text"
            required
            className="input"
            value={username}
            onChange={(e) => { setUsername(e.target.value); clearValidity(usernameRef); }}
            disabled={isLoading}
            minLength={3}
            maxLength={24}
            pattern="^[a-zA-Z0-9_\-]+$"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>EMAIL</label>
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
            <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>VERIFY EMAIL</label>
            <input
              ref={verifyEmailRef}
              type="email"
              required
              className="input"
              value={verifyEmail}
              onChange={(e) => { setVerifyEmail(e.target.value); clearValidity(verifyEmailRef); }}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
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
              minLength={8}
            />
          </div>
          <div>
            <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>VERIFY</label>
            <input
              ref={verifyPasswordRef}
              type="password"
              required
              className="input"
              value={verifyPassword}
              onChange={(e) => { setVerifyPassword(e.target.value); clearValidity(verifyPasswordRef); }}
              disabled={isLoading}
            />
          </div>
        </div>

        <div style={{ marginTop: "24px" }}>
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "10px 24px" }}
          >
            {isLoading ? "Signing up..." : "CREATE ACCOUNT"}
            <span className="material-symbols-outlined" style={{ fontSize: "16px", marginLeft: "8px" }}>person_add</span>
          </button>
        </div>
      </form>
    </div>
  );
}
