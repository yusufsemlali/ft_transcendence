"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import api from "@/lib/api/api";
import { UpdateUser } from "@ft-transcendence/contracts";

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
        // Error handled silently
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
      {/* Profile Preview Section */}
      <section className="section" style={{ overflow: "hidden", padding: 0 }}>
        <div style={{ 
          height: "180px", 
          width: "100%", 
          background: profile.banner ? `url(${profile.banner}) center/cover no-repeat` : "var(--gradient-prism)",
          position: "relative"
        }}>
          <div style={{
            position: "absolute",
            bottom: "-40px",
            left: "2rem",
            display: "flex",
            alignItems: "flex-end",
            gap: "1.5rem"
          }}>
            <div style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              border: "4px solid var(--background)",
              background: profile.avatar ? `url(${profile.avatar}) center/cover no-repeat` : "var(--bg-secondary)",
              boxShadow: "var(--shadow-glass)"
            }} />
            <div style={{ paddingBottom: "0.5rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0, lineHeight: 1.2 }}>
                {profile.displayName || profile.username || "Anonymous"}
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>
                {profile.tagline || "@" + profile.username}
              </p>
            </div>
          </div>
        </div>
        <div style={{ height: "60px" }} />
      </section>

      {/* Profile Identity */}
      <section className="section">
        <div className="section-header">
          <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="section-title">profile identity</span>
          <svg className="section-edit" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        <p className="section-description">
          Update your public identity. This information will be visible to other players on the platform.
        </p>

        <form onSubmit={handleUpdateProfile} className="stack-md">
          <div className="settings-row">
            <div className="settings-main">
              <label className="section-note">username</label>
              <input
                ref={usernameRef}
                className="input"
                value={profile.username ?? ""}
                onChange={(e) => { setProfile({ ...profile, username: e.target.value }); clearValidity(usernameRef); }}
                placeholder="Unique identifier"
                disabled={isLoading}
              />
            </div>
            <div className="settings-main">
              <label className="section-note">display name</label>
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

          <div className="settings-main">
            <label className="section-note">tagline</label>
            <input
              ref={taglineRef}
              className="input"
              value={profile.tagline ?? ""}
              onChange={(e) => { setProfile({ ...profile, tagline: e.target.value }); clearValidity(taglineRef); }}
              placeholder="Short catchy phrase"
              disabled={isLoading}
            />
          </div>

          <div className="settings-main">
            <label className="section-note">bio</label>
            <textarea
              ref={bioRef}
              className="input"
              value={profile.bio ?? ""}
              onChange={(e) => { setProfile({ ...profile, bio: e.target.value }); clearValidity(bioRef); }}
              placeholder="Tell us about yourself"
              style={{ minHeight: "100px", resize: "vertical" }}
              disabled={isLoading}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Identity"}
            </button>
          </div>
        </form>
      </section>

      {/* Visuals Section */}
      <section className="section">
        <div className="section-header">
          <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="section-title">visuals</span>
        </div>
        <p className="section-description">
          Customise your profile's look with an avatar and banner. Use high-quality URLs for the best results.
        </p>

        <form onSubmit={handleUpdateProfile} className="stack-md">
          <div className="settings-row">
            <div className="settings-main">
              <label className="section-note">avatar url</label>
              <input
                ref={avatarRef}
                className="input"
                value={profile.avatar ?? ""}
                onChange={(e) => { setProfile({ ...profile, avatar: e.target.value }); clearValidity(avatarRef); }}
                placeholder="https://..."
                disabled={isLoading}
              />
            </div>
            <div className="settings-main">
              <label className="section-note">banner url</label>
              <input
                ref={bannerRef}
                className="input"
                value={profile.banner ?? ""}
                onChange={(e) => { setProfile({ ...profile, banner: e.target.value }); clearValidity(bannerRef); }}
                placeholder="https://..."
                disabled={isLoading}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Visuals"}
            </button>
          </div>
        </form>
      </section>

      {/* Security Section */}
      <section className="section">
        <div className="section-header">
          <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="section-title">security</span>
        </div>
        <p className="section-description">
          Ensure your account is secure by using a strong, unique password.
        </p>

        <form onSubmit={handleChangePassword} className="stack-md">
          <div className="settings-main">
            <label className="section-note">current password</label>
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

          <div className="settings-row">
            <div className="settings-main">
              <label className="section-note">new password</label>
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
            <div className="settings-main">
              <label className="section-note">confirm password</label>
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

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              Update Password
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function AccountSettingsPage() {
  return (
    <div className="page animate-fade-in">
      <header className="page-title" style={{ paddingBottom: "1rem", marginBottom: "3rem" }}>
        account settings
      </header>

      <Suspense fallback={<div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>loading identity...</div>}>
        <AccountSettingsContent />
      </Suspense>
    </div>
  );
}