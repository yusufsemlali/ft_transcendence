"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";

export default function RegisterForm() {
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");

  // Refs for native browser validation tooltips
  const usernameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const verifyEmailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const verifyPasswordRef = useRef<HTMLInputElement>(null);

  // Clear custom validity when user starts typing
  const clearValidity = (ref: React.RefObject<HTMLInputElement | null>) => {
    ref.current?.setCustomValidity("");
  };

  // Show native browser tooltip on a specific input
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

    // Client-side validation using native tooltips
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

      // Map server errors to specific fields using native tooltips
      if (result.validationErrors && result.validationErrors.length > 0) {
        // Zod validation errors (400) — show the first one on the right field
        for (const err of result.validationErrors) {
          const field = err.path?.[0];
          const msg = err.message || "Invalid value";
          if (field === "username") { showFieldError(usernameRef, msg); return; }
          if (field === "email") { showFieldError(emailRef, msg); return; }
          if (field === "password") { showFieldError(passwordRef, msg); return; }
        }
      }

      // 409 conflict errors — match the message to the right field
      const lower = errorMsg.toLowerCase();
      if (lower.includes("email")) {
        showFieldError(emailRef, errorMsg);
      } else if (lower.includes("username")) {
        showFieldError(usernameRef, errorMsg);
      } else {
        // Generic error — show on the first field
        showFieldError(usernameRef, errorMsg);
      }
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
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          <span className="section-title">register</span>
        </div>
      </div>

      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: "1rem" }}>
          <input
            ref={usernameRef}
            type="text"
            required
            className="input"
            placeholder="username"
            value={username}
            onChange={(e) => { setUsername(e.target.value); clearValidity(usernameRef); }}
            disabled={isLoading}
            minLength={3}
            maxLength={24}
            pattern="^[a-zA-Z0-9_\-]+$"
            title="Username can only contain letters, numbers, underscores, and hyphens"
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <input
            ref={emailRef}
            type="email"
            required
            className="input"
            placeholder="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearValidity(emailRef); }}
            disabled={isLoading}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <input
            ref={verifyEmailRef}
            type="email"
            required
            className="input"
            placeholder="verify email"
            value={verifyEmail}
            onChange={(e) => { setVerifyEmail(e.target.value); clearValidity(verifyEmailRef); }}
            disabled={isLoading}
            autoComplete="off"
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <input
            ref={passwordRef}
            type="password"
            required
            className="input"
            placeholder="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearValidity(passwordRef); }}
            disabled={isLoading}
            minLength={8}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <input
            ref={verifyPasswordRef}
            type="password"
            required
            className="input"
            placeholder="verify password"
            value={verifyPassword}
            onChange={(e) => { setVerifyPassword(e.target.value); clearValidity(verifyPasswordRef); }}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-secondary"
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
              signing up...
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
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
              sign up
            </>
          )}
        </button>
      </form>
    </div>
  );
}
