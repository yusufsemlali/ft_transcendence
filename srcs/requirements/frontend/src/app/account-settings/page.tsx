"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import api from "@/lib/api/api";
import { UpdateUser, User } from "@ft-transcendence/contracts";

function AccountSettingsContent() {
  const { refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UpdateUser>({
    username: "",
    displayName: "",
    tagline: "",
    bio: "",
    avatar: "",
    banner: "",
  });

  const [fullUser, setFullUser] = useState<User | null>(null);

  // Refs for native validation tooltips
  const usernameRef = useRef<HTMLInputElement>(null);
  const displayNameRef = useRef<HTMLInputElement>(null);
  const taglineRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const currentPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.users.getMe({});
        if (res.status === 200) {
          const userData = res.body;
          setFullUser(userData);
          setProfile({
            username: userData.username,
            displayName: userData.displayName || "",
            tagline: userData.tagline || "",
            bio: userData.bio || "",
            avatar: userData.avatar || "",
            banner: userData.banner || "",
          });
        }
      } catch (err) {
        // Silently handle error
      }
    };
    fetchUser();
  }, []);

  const clearValidity = (ref: React.RefObject<any>) => {
    ref.current?.setCustomValidity("");
  };

  const showFieldError = (ref: React.RefObject<any>, message: string) => {
    if (ref.current) {
      ref.current.setCustomValidity(message);
      requestAnimationFrame(() => {
        ref.current?.reportValidity();
      });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await api.users.updateMe({ body: profile });
      
      if (res.status === 200) {
        toast.success("Profile updated successfully!");
        refreshUser();
      } else {
        const errorData = res.body as any;
        const message = errorData.message || "Failed to update profile";
        
        if (message.toLowerCase().includes("username")) {
          showFieldError(usernameRef, message);
        } else if (message.toLowerCase().includes("display")) {
          showFieldError(displayNameRef, message);
        } else {
          toast.error(message);
        }
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showFieldError(confirmPasswordRef, "Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      showFieldError(newPasswordRef, "Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.users.changePassword({
        body: { currentPassword, newPassword }
      });

      if (res.status === 200) {
        toast.success("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const errorData = res.body as any;
        const message = errorData.message || "Failed to update password";
        
        if (message.toLowerCase().includes("current")) {
          showFieldError(currentPasswordRef, message);
        } else {
          toast.error(message);
        }
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "4rem" }}>
      {/* Cinematic Profile Hero (Featured Card style) */}
      <div
        className="glass-card"
        style={{
          padding: "48px",
          marginBottom: "40px",
          position: "relative",
          overflow: "hidden",
          minHeight: "400px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          border: "1px solid var(--border-color)",
        }}
      >
        {/* Banner with Masking (matching Tournaments) */}
        <img
          src={profile.banner || "/images/leage.jpeg"}
          alt="Hero background"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "60%",
            height: "100%",
            objectFit: "cover",
            maskImage: "linear-gradient(to left, black 70%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to left, black 70%, transparent 100%)",
            opacity: 0.6,
            zIndex: 0,
          }}
          onError={(e) => { e.currentTarget.src = "/images/leage.jpeg"; }}
        />

        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "32px" }}>
             <div style={{
               width: "120px",
               height: "120px",
               borderRadius: "50%",
               border: "4px solid var(--background)",
               background: profile.avatar ? `url(${profile.avatar}) center/cover no-repeat` : "var(--bg-secondary)",
               boxShadow: "var(--shadow-glass)",
               overflow: "hidden"
             }}>
               {!profile.avatar && (
                 <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                   <span className="material-symbols-outlined" style={{ fontSize: "64px", color: "var(--text-muted)" }}>person</span>
                 </div>
               )}
             </div>

             <div>
               <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                 <span className="badge" style={{ backgroundColor: "var(--accent-secondary)", color: "white" }}>STATIONARY</span>
                 <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                   <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>verified_user</span> Verified Player
                 </span>
               </div>

               <h2
                 className="text-gradient"
                 style={{
                   fontSize: "48px",
                   fontWeight: "700",
                   margin: 0,
                   lineHeight: "1.1",
                 }}
               >
                 {profile.displayName || profile.username || "Anonymous"}
               </h2>
               <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginTop: "4px" }}>
                 {profile.tagline || "@" + profile.username}
               </p>
             </div>
          </div>

          {/* Stats Bar (XP / LEVEL / ELO pattern) */}
          <div style={{ display: "flex", gap: "40px", marginBottom: "32px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "4px" }}>EXPERIENCE</div>
              <div style={{ fontSize: "24px", color: "var(--accent-info)", fontFamily: "var(--font-mono)" }}>{fullUser?.xp || 0} XP</div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "4px" }}>LEVEL</div>
              <div style={{ fontSize: "24px", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>LVL {fullUser?.level || 1}</div>
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "4px" }}>ELO RATING</div>
              <div style={{ fontSize: "24px", color: "var(--accent-success)", fontFamily: "var(--font-mono)" }}>{fullUser?.eloRating || 1200}</div>
            </div>
          </div>
        </div>

        <div style={{ 
          position: "absolute", 
          top: "-50%", 
          right: "-10%", 
          width: "600px", 
          height: "600px", 
          background: "radial-gradient(circle, color-mix(in srgb, var(--accent-primary), transparent 90%) 0%, transparent 70%)", 
          zIndex: 1 
        }} />
      </div>

       {/* Form Grid Section (Matching Listing Card Style) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
        
        {/* Profile Identity Card */}
        <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--border-color)" }}>
          <div className="section-header" style={{ marginBottom: "24px" }}>
            <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="section-title">PROFILE IDENTITY</span>
          </div>

          <form onSubmit={handleUpdateProfile} className="stack-md">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
               <div>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>USERNAME</label>
                  <input
                    ref={usernameRef}
                    className="input"
                    value={profile.username ?? ""}
                    onChange={(e) => { setProfile({ ...profile, username: e.target.value }); clearValidity(usernameRef); }}
                    placeholder="Unique identifier"
                    disabled={isLoading}
                  />
               </div>
               <div>
                 <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>DISPLAY NAME</label>
                 <input
                   ref={displayNameRef}
                   className="input"
                   value={profile.displayName ?? ""}
                   onChange={(e) => { setProfile({ ...profile, displayName: e.target.value }); clearValidity(displayNameRef); }}
                   placeholder="How others see you"
                   disabled={isLoading}
                 />
               </div>
            </div>

            <div>
              <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>TAGLINE</label>
              <input
                ref={taglineRef}
                className="input"
                value={profile.tagline ?? ""}
                onChange={(e) => { setProfile({ ...profile, tagline: e.target.value }); clearValidity(taglineRef); }}
                placeholder="A short punchy line"
                disabled={isLoading}
              />
            </div>

            <div>
              <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>BIO</label>
              <textarea
                ref={bioRef}
                className="input"
                value={profile.bio ?? ""}
                onChange={(e) => { setProfile({ ...profile, bio: e.target.value }); clearValidity(bioRef); }}
                placeholder="Tell us your story..."
                style={{ minHeight: "120px", resize: "none" }}
                disabled={isLoading}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "16px" }}>
              <button type="submit" className="btn btn-primary" style={{ padding: "10px 24px" }} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Identity"} 
                <span className="material-symbols-outlined" style={{ fontSize: "16px", marginLeft: "4px" }}>done</span>
              </button>
            </div>
          </form>
        </section>

        {/* Visuals & Appearance Card */}
        <div className="stack-md">
          <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--border-color)" }}>
            <div className="section-header" style={{ marginBottom: "24px" }}>
              <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="section-title">VISUALS</span>
            </div>

            <form onSubmit={handleUpdateProfile} className="stack-md">
               <div>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>AVATAR URL</label>
                  <input
                    ref={avatarRef}
                    className="input"
                    value={profile.avatar ?? ""}
                    onChange={(e) => { setProfile({ ...profile, avatar: e.target.value }); clearValidity(avatarRef); }}
                    placeholder="https://example.com/avatar.png"
                    disabled={isLoading}
                  />
               </div>
               <div>
                 <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>BANNER URL</label>
                 <input
                   ref={bannerRef}
                   className="input"
                   value={profile.banner ?? ""}
                   onChange={(e) => { setProfile({ ...profile, banner: e.target.value }); clearValidity(bannerRef); }}
                   placeholder="https://example.com/banner.png"
                   disabled={isLoading}
                 />
               </div>
               <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "8px" }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: "10px 24px" }} disabled={isLoading}>
                    Save Visuals
                  </button>
               </div>
            </form>
          </section>

          {/* Security & Access Card */}
          <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--border-color)" }}>
            <div className="section-header" style={{ marginBottom: "24px" }}>
              <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="section-title">SECURITY</span>
            </div>

            <form onSubmit={handleChangePassword} className="stack-md">
              <div>
                <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>CURRENT PASSWORD</label>
                <input
                  ref={currentPasswordRef}
                  type="password"
                  className="input"
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); clearValidity(currentPasswordRef); }}
                  required
                  disabled={isLoading}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>NEW PASSWORD</label>
                  <input
                    ref={newPasswordRef}
                    type="password"
                    className="input"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); clearValidity(newPasswordRef); }}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>CONFIRM</label>
                  <input
                    ref={confirmPasswordRef}
                    type="password"
                    className="input"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); clearValidity(confirmPasswordRef); }}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "8px" }}>
                <button type="submit" className="btn btn-primary" style={{ padding: "10px 24px" }} disabled={isLoading}>
                  Update Security
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AccountSettingsPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        color: "var(--text-primary)",
        fontFamily: "var(--font-sans)",
        backgroundColor: "transparent",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <h1 style={{ fontSize: "36px", fontWeight: "300", margin: 0 }}>
            Account Settings
          </h1>

          <div
            className="glass"
            style={{
              padding: "4px 8px",
              borderRadius: "24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "1px solid var(--border-color)",
            }}
          >
            <span className="material-symbols-outlined" style={{ color: "var(--text-muted)", fontSize: "18px" }}>info</span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", paddingRight: "8px" }}>Identity & Security center</span>
          </div>
        </header>

        <Suspense fallback={<div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Loading secure details...</div>}>
          <AccountSettingsContent />
        </Suspense>
      </div>
    </div>
  );
}