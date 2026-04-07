"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api/api";
import type { User, Handle, Sport } from "@ft-transcendence/contracts";
import Link from "next/link";

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [handles, setHandles] = useState<Handle[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, handlesRes, sportsRes] = await Promise.all([
          api.users.getUserById({ params: { id: userId } }),
          api.handles.getUserHandles({ params: { userId } }),
          api.sports.getSports(),
        ]);

        if (userRes.status === 200) {
          setUser(userRes.body);
        } else {
          setError("User not found");
        }

        if (handlesRes.status === 200) setHandles(handlesRes.body);
        if (sportsRes.status === 200) setSports(sportsRes.body);
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const getSportName = (sportId: string) => {
    return sports.find((s) => s.id === sportId)?.name || "Unknown";
  };

  if (loading) {
    return (
      <div className="page" style={{ minHeight: "100vh", color: "var(--text-primary)" }}>
        <div className="animate-fade-in">
          {/* Skeleton hero */}
          <div className="glass-card" style={{ padding: "48px", marginBottom: "24px", border: "1px solid var(--border-color)", minHeight: "300px" }}>
            <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
              <div style={{ width: "120px", height: "120px", borderRadius: "50%", background: "var(--border-color)" }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: "32px", width: "200px", background: "var(--border-color)", borderRadius: "6px", marginBottom: "12px" }} />
                <div style={{ height: "16px", width: "300px", background: "var(--border-color)", borderRadius: "4px" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="page" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-primary)" }}>
        <div style={{ textAlign: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "64px", color: "var(--text-muted)", opacity: 0.2 }}>person_off</span>
          <h2 style={{ fontSize: "24px", fontWeight: 300, marginTop: "16px", color: "var(--text-primary)" }}>{error || "User not found"}</h2>
          <Link href="/leaderboard" className="btn btn-secondary" style={{ marginTop: "16px", display: "inline-flex", padding: "8px 20px", fontSize: "13px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_back</span>
            Back to Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  const statusColor = user.isOnline ? "var(--accent-success)" : "var(--text-muted)";

  return (
    <div className="page" style={{ minHeight: "100vh", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
      <div className="animate-fade-in" style={{ paddingBottom: "4rem" }}>

        {/* Hero Card */}
        <div
          className="glass-card"
          style={{
            padding: "clamp(24px, 4vw, 48px)",
            marginBottom: "24px",
            position: "relative",
            overflow: "hidden",
            minHeight: "clamp(280px, 40vw, 400px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            border: "1px solid var(--border-color)",
          }}
        >
          {/* Banner */}
          {user.banner && (
            <img
              src={user.banner}
              alt="Banner"
              style={{
                position: "absolute", top: 0, right: 0, width: "60%", height: "100%",
                objectFit: "cover",
                maskImage: "linear-gradient(to left, black 70%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(to left, black 70%, transparent 100%)",
                opacity: 0.5, zIndex: 0,
              }}
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          )}

          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "clamp(16px, 3vw, 24px)", marginBottom: "32px", flexWrap: "wrap" }}>
              <div style={{
                width: "clamp(80px, 15vw, 120px)", height: "clamp(80px, 15vw, 120px)",
                borderRadius: "50%", border: "4px solid var(--background)",
                background: user.avatar ? `url(${user.avatar}) center/cover no-repeat` : "var(--bg-secondary)",
                boxShadow: "var(--shadow-glass)", overflow: "hidden", flexShrink: 0, position: "relative",
              }}>
                {!user.avatar && (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "clamp(40px, 8vw, 64px)", color: "var(--text-muted)" }}>person</span>
                  </div>
                )}
                {/* Online indicator */}
                <div style={{
                  position: "absolute", bottom: "4px", right: "4px",
                  width: "16px", height: "16px", borderRadius: "50%",
                  background: statusColor, border: "3px solid var(--background)",
                  boxShadow: user.isOnline ? `0 0 8px ${statusColor}` : "none",
                }} />
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px", background: `color-mix(in srgb, ${statusColor}, transparent 85%)`, color: statusColor, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {user.isOnline ? "online" : "offline"}
                  </span>
                  <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px", background: "color-mix(in srgb, var(--accent-primary), transparent 85%)", color: "var(--accent-primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {user.role}
                  </span>
                </div>

                <h1
                  className="text-gradient"
                  style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: "700", margin: 0, lineHeight: "1.1" }}
                >
                  {user.displayName || user.username}
                </h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginTop: "4px" }}>
                  @{user.username}
                  {user.tagline && <span style={{ color: "var(--text-muted)", marginLeft: "12px" }}>· {user.tagline}</span>}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "4px" }}>EXPERIENCE</div>
                <div style={{ fontSize: "24px", color: "var(--accent-info)", fontFamily: "var(--font-mono)" }}>{user.xp} XP</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "4px" }}>LEVEL</div>
                <div style={{ fontSize: "24px", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>LVL {user.level}</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "4px" }}>ELO RATING</div>
                <div style={{ fontSize: "24px", color: "var(--accent-success)", fontFamily: "var(--font-mono)" }}>{user.eloRating}</div>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "4px" }}>MEMBER SINCE</div>
                <div style={{ fontSize: "24px", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{new Date(user.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div style={{ position: "absolute", top: "-50%", right: "-10%", width: "600px", height: "600px", background: "radial-gradient(circle, color-mix(in srgb, var(--accent-primary), transparent 90%) 0%, transparent 70%)", zIndex: 1 }} />
        </div>

        {/* Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))", gap: "24px" }}>

          {/* Bio Card */}
          {user.bio && (
            <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--border-color)" }}>
              <div className="section-header" style={{ marginBottom: "16px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--text-muted)" }}>info</span>
                <span className="section-title">ABOUT</span>
              </div>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>{user.bio}</p>
            </section>
          )}

          {/* Game Handles */}
          <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--border-color)" }}>
            <div className="section-header" style={{ marginBottom: "16px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--text-muted)" }}>sports_esports</span>
              <span className="section-title">GAME HANDLES</span>
            </div>
            {handles.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "var(--text-muted)", opacity: 0.15 }}>link_off</span>
                <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "8px" }}>No game handles linked</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {handles.map((h) => (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "10px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "color-mix(in srgb, var(--accent-primary), transparent 88%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent-primary)" }}>sports_esports</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{h.handle}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{getSportName(h.sportId)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
