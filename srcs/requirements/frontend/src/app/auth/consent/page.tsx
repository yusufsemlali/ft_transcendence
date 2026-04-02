"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";

function ConsentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const username = searchParams.get("username");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshUser } = useAuth();

  if (!token || !username) {
    return (
      <div className="page" style={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "60vh" }}>
        <div className="section animate-fade-in" style={{ margin: "0 auto", maxWidth: "400px" }}>
          <div className="section-header" style={{ justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ color: "var(--destructive)" }}>error</span>
            <span className="section-title">Invalid Session</span>
          </div>
          <div className="section-description">
            The authentication session is missing or has expired. Please try logging in again.
          </div>
          <button 
            onClick={() => router.push("/login")} 
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://localhost:8080/api";
      const response = await fetch(`${apiBase}/auth/42/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken: token, consent: true }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to complete registration");
      }

      toast.success("Welcome aboard, " + username + "!");
      localStorage.setItem("isLoggedIn", "true");
      await refreshUser();
      router.push("/profile");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong during confirmation");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page animate-fade-in" style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "80vh" }}>
      <div className="section glass-card" style={{ padding: "var(--space-xl)", maxWidth: "500px", margin: "0 auto" }}>
        <div className="section-header" style={{ marginBottom: "var(--space-lg)" }}>
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/8/8d/42_Logo.svg" 
            alt="42 Logo" 
            style={{ 
              width: "32px", 
              height: "32px", 
              marginRight: "var(--space-sm)",
              filter: "brightness(0) invert(1)" 
            }}
          />
          <span className="section-title">data permission</span>
        </div>

        <div className="stack stack-lg">
          <div>
            <div className="stat-label">AUTHENTICATED AS</div>
            <div className="stat-value" style={{ fontSize: "1.5rem" }}>@{username}</div>
          </div>

          <div className="section-description" style={{ marginBottom: 0 }}>
            We've successfully linked with your 42 Intra account. To finalize your registration, we need your explicit permission to store your profile data.
          </div>
          
          <div style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius)", padding: "var(--space-md)" }}>
             <div className="section-note" style={{ textTransform: "uppercase", fontWeight: "bold", marginBottom: "var(--space-xs)", color: "var(--primary)" }}>
                WHAT WE WILL STORE:
             </div>
             <div className="stack stack-xs">
                <div className="nav-link" style={{ cursor: "default" }}><span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>person</span> Username: {username}</div>
                <div className="nav-link" style={{ cursor: "default" }}><span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>alternate_email</span> Email Address</div>
                <div className="nav-link" style={{ cursor: "default" }}><span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>image</span> Profile Picture</div>
             </div>
          </div>

          <div className="section-note">
             By clicking confirm, you agree to our terms of service and privacy policy regarding 42 Intra data usage. We do not store your 42 password.
          </div>

          <div className="stack stack-sm" style={{ marginTop: "var(--space-lg)" }}>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "0.75rem" }}
            >
              {isSubmitting ? "FINALIZING..." : "CONFIRM & REGISTER"}
            </button>
            
            <button
              onClick={() => router.push("/login")}
              disabled={isSubmitting}
              className="btn btn-ghost"
              style={{ width: "100%", justifyContent: "center" }}
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
        <p className="text-secondary animate-pulse">Establishing secure connection...</p>
      </div>
    }>
      <ConsentPageContent />
    </Suspense>
  );
}
