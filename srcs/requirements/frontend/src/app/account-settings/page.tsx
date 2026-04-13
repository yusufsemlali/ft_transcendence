"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/store/hooks";
import { toast } from "@/components/ui/sonner";
import api from "@/lib/api/api";
import { uploadFile } from "@/lib/upload";
import { UpdateUser, User } from "@ft-transcendence/contracts";
import { useRouter } from "next/navigation";

const DEFAULT_AVATAR_URL =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

function AccountSettingsContent() {
  const { refreshUser, logout } = useAuth();
  const router = useRouter();
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
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(0);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerProgress, setBannerProgress] = useState(0);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const currentPasswordRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  // GDPR state
  const [gdprExporting, setGdprExporting] = useState(false);
  const [gdprDeleting, setGdprDeleting] = useState(false);
  const [gdprConfirmText, setGdprConfirmText] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      } catch {
        // Silently handle error
      }
    };
    fetchUser();
  }, []);

  const clearValidity = (ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>) => {
    if (ref.current) {
      (ref.current as HTMLInputElement | HTMLTextAreaElement).setCustomValidity("");
    }
  };

  const showFieldError = (ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>, message: string) => {
    const el = ref.current;
    if (el) {
      (el as HTMLInputElement | HTMLTextAreaElement).setCustomValidity(message);
      requestAnimationFrame(() => {
        (el as HTMLInputElement | HTMLTextAreaElement).reportValidity();
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
        const errorData = res.body as { message?: string };
        const message = errorData.message || "Failed to update profile";
        
        if (message.toLowerCase().includes("username")) {
          showFieldError(usernameRef, message);
        } else if (message.toLowerCase().includes("display")) {
          showFieldError(displayNameRef, message);
        } else {
          toast.error(message);
        }
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const runImageUpload = async (
    file: File,
    field: "avatar" | "banner",
    setUploading: (v: boolean) => void,
    setProgress: (v: number) => void
  ) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or less.");
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const result = await uploadFile(file, { onProgress: setProgress });
      const res = await api.users.updateMe({
        body: field === "avatar" ? { avatar: result.url } : { banner: result.url },
      });
      if (res.status === 200) {
        setProfile((p) => ({ ...p, [field]: result.url }));
        setFullUser(res.body);
        toast.success(field === "avatar" ? "Avatar updated" : "Banner updated");
        refreshUser();
      } else {
        const errorData = res.body as { message?: string };
        toast.error(errorData.message || "Failed to save");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await runImageUpload(file, "avatar", setAvatarUploading, setAvatarProgress);
  };

  const onBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await runImageUpload(file, "banner", setBannerUploading, setBannerProgress);
  };

  const clearVisual = async (field: "avatar" | "banner") => {
    setIsLoading(true);
    try {
      const body =
        field === "avatar"
          ? { avatar: DEFAULT_AVATAR_URL }
          : { banner: null };
      const res = await api.users.updateMe({ body });
      if (res.status === 200) {
        setProfile((p) => ({
          ...p,
          [field]: field === "avatar" ? DEFAULT_AVATAR_URL : "",
        }));
        setFullUser(res.body);
        toast.success(field === "avatar" ? "Avatar reset" : "Banner removed");
        refreshUser();
      } else {
        const errorData = res.body as { message?: string };
        toast.error(errorData.message || "Failed to update");
      }
    } catch {
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
        const errorData = res.body as { message?: string };
        const message = errorData.message || "Failed to update password";
        
        if (message.toLowerCase().includes("current")) {
          showFieldError(currentPasswordRef, message);
        } else {
          toast.error(message);
        }
      }
    } catch {
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
          padding: "clamp(24px, 4vw, 48px)",
          marginBottom: "40px",
          position: "relative",
          overflow: "hidden",
          minHeight: "clamp(280px, 40vw, 400px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          border: "1px solid var(--border-color)",
        }}
      >
        {/* Banner with Masking (matching Tournaments) */}
        <Image
          src={profile.banner || "/images/placeholder_banner.png"}
          alt="Hero background"
          fill
          style={{
            objectFit: "cover",
            maskImage: "linear-gradient(to left, black 70%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to left, black 70%, transparent 100%)",
            opacity: 0.6,
            zIndex: 0,
          }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/placeholder_banner.png"; }}
        />

        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "clamp(16px, 3vw, 24px)", marginBottom: "32px", flexWrap: "wrap" }}>
             <div style={{
               width: "clamp(80px, 15vw, 120px)",
               height: "clamp(80px, 15vw, 120px)",
               borderRadius: "50%",
               border: "4px solid var(--background)",
               background: profile.avatar ? `url(${profile.avatar}) center/cover no-repeat` : "var(--bg-secondary)",
               boxShadow: "var(--shadow-glass)",
               overflow: "hidden",
               flexShrink: 0
             }}>
               {!profile.avatar && (
                 <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                   <span className="material-symbols-outlined" style={{ fontSize: "clamp(40px, 8vw, 64px)", color: "var(--text-muted)" }}>person</span>
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
                   fontSize: "clamp(28px, 5vw, 48px)",
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(400px, 100%), 1fr))", gap: "24px" }}>
        
        {/* Profile Identity Card */}
        <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--border-color)" }}>
          <div className="section-header" style={{ marginBottom: "24px" }}>
            <svg className="section-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="section-title">PROFILE IDENTITY</span>
          </div>

          <form onSubmit={handleUpdateProfile} className="stack-md">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: "16px" }}>
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

            <div className="stack-md">
              <div>
                <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>AVATAR</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                  <input
                    ref={avatarFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: "none" }}
                    onChange={onAvatarFile}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => avatarFileRef.current?.click()}
                    disabled={isLoading || avatarUploading}
                  >
                    {avatarUploading ? "Uploading…" : "Upload avatar"}
                  </button>
                  {profile.avatar && profile.avatar !== DEFAULT_AVATAR_URL ? (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontSize: "13px", color: "var(--destructive-foreground)" }}
                      onClick={() => clearVisual("avatar")}
                      disabled={isLoading || avatarUploading}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                {avatarUploading && (
                  <div style={{ width: "100%", marginTop: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px", fontWeight: "bold" }}>
                      <span>UPLOADING AVATAR...</span>
                      <span>{avatarProgress}%</span>
                    </div>
                    <div style={{ height: "4px", width: "100%", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "var(--primary)", width: `${avatarProgress}%`, transition: "width 0.2s" }} />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "8px", display: "block" }}>PROFILE BANNER</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                  <input
                    ref={bannerFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    style={{ display: "none" }}
                    onChange={onBannerFile}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => bannerFileRef.current?.click()}
                    disabled={isLoading || bannerUploading}
                  >
                    {bannerUploading ? "Uploading…" : "Upload banner"}
                  </button>
                  {profile.banner ? (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontSize: "13px", color: "var(--destructive-foreground)" }}
                      onClick={() => clearVisual("banner")}
                      disabled={isLoading || bannerUploading}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                {bannerUploading && (
                  <div style={{ width: "100%", marginTop: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px", fontWeight: "bold" }}>
                      <span>UPLOADING BANNER...</span>
                      <span>{bannerProgress}%</span>
                    </div>
                    <div style={{ height: "4px", width: "100%", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "var(--primary)", width: `${bannerProgress}%`, transition: "width 0.2s" }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
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

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: "16px" }}>
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

          {/* ─── GDPR: Data & Privacy ─── */}
          <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--border-color)" }}>
            <div className="section-header" style={{ marginBottom: "16px" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>download</span>
              <span className="section-title">EXPORT YOUR DATA</span>
            </div>
            <p className="section-description" style={{ marginBottom: "20px" }}>
              Download a copy of all personal data we store about you — profile, settings, friends, organizations, files, and notifications.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                disabled={gdprExporting}
                className="btn btn-secondary"
                style={{ flex: 1, minWidth: "160px", justifyContent: "center" }}
                onClick={async () => {
                  setGdprExporting(true);
                  try {
                    const res = await api.gdpr.exportMyData();
                    if (res.status === 200) {
                      const blob = new Blob([JSON.stringify(res.body, null, 2)], { type: "application/json" });
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(blob);
                      a.download = `gdpr-export-${Date.now()}.json`;
                      a.click();
                      URL.revokeObjectURL(a.href);
                      toast.success("Data exported as JSON");
                    }
                  } catch { toast.error("Export failed"); }
                  finally { setGdprExporting(false); }
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px", marginRight: "8px" }}>data_object</span>
                {gdprExporting ? "Exporting…" : "Export JSON"}
              </button>
              <button
                disabled={gdprExporting}
                className="btn btn-secondary"
                style={{ flex: 1, minWidth: "160px", justifyContent: "center" }}
                onClick={async () => {
                  setGdprExporting(true);
                  try {
                    const res = await api.gdpr.exportMyDataCsv();
                    if (res.status === 200) {
                      const blob = new Blob([res.body as string], { type: "text/csv" });
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(blob);
                      a.download = `gdpr-export-${Date.now()}.csv`;
                      a.click();
                      URL.revokeObjectURL(a.href);
                      toast.success("Data exported as CSV");
                    }
                  } catch { toast.error("Export failed"); }
                  finally { setGdprExporting(false); }
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px", marginRight: "8px" }}>table_chart</span>
                {gdprExporting ? "Exporting…" : "Export CSV"}
              </button>
            </div>
          </section>

          {/* ─── GDPR: Danger Zone ─── */}
          <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--destructive-foreground, #f44336)", background: "rgba(244,67,54,0.03)" }}>
            <div className="section-header" style={{ marginBottom: "16px" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--destructive-foreground, #f44336)" }}>warning</span>
              <span className="section-title" style={{ color: "var(--destructive-foreground, #f44336)" }}>DANGER ZONE</span>
            </div>
            <p className="section-description" style={{ marginBottom: "16px" }}>
              Permanently delete your account and all associated data. This is <strong>irreversible</strong>.
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn"
                style={{ background: "transparent", border: "1px solid var(--destructive-foreground, #f44336)", color: "var(--destructive-foreground, #f44336)", cursor: "pointer" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px", marginRight: "8px" }}>delete_forever</span>
                Delete my account
              </button>
            ) : (
              <div style={{ padding: "20px", borderRadius: "var(--radius)", border: "1px solid var(--destructive-foreground, #f44336)", background: "rgba(244,67,54,0.05)" }}>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "12px" }}>
                  Type <strong style={{ color: "var(--destructive-foreground, #f44336)" }}>DELETE MY ACCOUNT</strong> to confirm:
                </p>
                <input
                  type="text"
                  value={gdprConfirmText}
                  onChange={(e) => setGdprConfirmText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="input"
                  style={{ width: "100%", marginBottom: "12px" }}
                />
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    disabled={gdprConfirmText !== "DELETE MY ACCOUNT" || gdprDeleting}
                    className="btn"
                    style={{
                      background: gdprConfirmText === "DELETE MY ACCOUNT" ? "var(--destructive-foreground, #f44336)" : "rgba(244,67,54,0.2)",
                      color: "white", border: "none",
                      cursor: gdprConfirmText === "DELETE MY ACCOUNT" ? "pointer" : "not-allowed",
                      opacity: gdprConfirmText === "DELETE MY ACCOUNT" ? 1 : 0.5,
                    }}
                    onClick={async () => {
                      setGdprDeleting(true);
                      try {
                        const res = await api.gdpr.requestDataDeletion({ body: { confirmation: "DELETE MY ACCOUNT" } });
                        if (res.status === 200) {
                          toast.success("Account deleted. Redirecting…");
                          setTimeout(() => { logout(); router.push("/login"); }, 2000);
                        }
                      } catch { toast.error("Deletion failed"); }
                      finally { setGdprDeleting(false); }
                    }}
                  >
                    {gdprDeleting ? "Deleting…" : "Permanently delete everything"}
                  </button>
                  <button onClick={() => { setShowDeleteConfirm(false); setGdprConfirmText(""); }} className="btn btn-ghost">Cancel</button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function AccountSettingsPage() {
  return (
    <div
      className="page"
      style={{
        minHeight: "100vh",
        color: "var(--text-primary)",
        fontFamily: "var(--font-sans)",
        backgroundColor: "transparent",
      }}
    >
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
          <h1 style={{ fontSize: "clamp(28px, 5vw, 36px)", fontWeight: "300", margin: 0 }}>
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
  );
}