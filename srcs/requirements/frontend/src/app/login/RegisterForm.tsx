"use client";

import { useState } from "react";
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

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Client-side validation
    if (email !== verifyEmail) {
      toast.error("Emails do not match", { description: "Validation Error" });
      return;
    }

    if (password !== verifyPassword) {
      toast.error("Passwords do not match", {
        description: "Validation Error",
      });
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters", {
        description: "Validation Error",
      });
      return;
    }

    const result = await register(email, username, password);

    if (result.success) {
      toast.success("Account created successfully!");
      router.push("/profile");
    } else {
      toast.error(result.error || "Registration failed", {
        description: "Failed to create account",
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
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          <span className="section-title">register</span>
        </div>
      </div>

      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            required
            className="input"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            minLength={3}
            maxLength={24}
            pattern="^[a-zA-Z0-9_-]+$"
            title="Username can only contain letters, numbers, underscores, and hyphens"
          />
        </div>

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
            type="email"
            required
            className="input"
            placeholder="verify email"
            value={verifyEmail}
            onChange={(e) => setVerifyEmail(e.target.value)}
            disabled={isLoading}
            autoComplete="off"
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
            minLength={8}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <input
            type="password"
            required
            className="input"
            placeholder="verify password"
            value={verifyPassword}
            onChange={(e) => setVerifyPassword(e.target.value)}
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
