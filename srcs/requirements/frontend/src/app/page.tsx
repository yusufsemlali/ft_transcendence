"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      title: "Tournament Brackets",
      description: "Create complex single or double elimination brackets in seconds.",
      icon: "account_tree",
      image: "/images/leage.jpeg"
    },
    {
      title: "Global Matchmaking",
      description: "Find players of your skill level from around the world.",
      icon: "public",
      image: "/images/val.jpeg"
    },
    {
      title: "Instant Results",
      description: "Automated scoring and real-time leaderboard updates.",
      icon: "bolt",
      image: "/images/cs2.jpeg"
    }
  ];

  const stats = [
    { label: "EVENTS", value: "1,247", color: "var(--accent-info)" },
    { label: "PLAYERS", value: "42.5k", color: "var(--text-primary)" },
    { label: "COMMUNITIES", value: "8.2k", color: "var(--accent-success)" }
  ];

  return (
    <div style={{
      minHeight: "100vh",
      padding: "40px 20px",
      color: "var(--text-primary)",
      fontFamily: "var(--font-sans)",
      backgroundColor: "transparent",
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header Persona */}
        <header style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "20px"
        }}>
          <h1 style={{ fontSize: "36px", fontWeight: "300", margin: 0 }}>
            Unified Platform
          </h1>
          <div className="glass" style={{
            padding: "8px 16px",
            borderRadius: "24px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border: "1px solid var(--border-color)",
          }}>
            <span className="material-symbols-outlined" style={{ color: "var(--text-muted)", fontSize: "20px" }}>hub</span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>v2.4.0-stable</span>
          </div>
        </header>

        {/* Cinematic Hero feature */}
        <div className="glass-card" style={{
          padding: "48px",
          marginBottom: "40px",
          position: "relative",
          overflow: "hidden",
          minHeight: "450px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          border: "1px solid var(--border-color)",
        }}>
          {/* Background Masking */}
          <img
            src="/images/leage.jpeg"
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
          />

          <div style={{ position: "relative", zIndex: 2, maxWidth: "600px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <span className="badge" style={{ backgroundColor: "var(--accent-secondary)", color: "white" }}>PLATFORM PERSONA</span>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>public</span> Global Competition Hub
              </span>
            </div>

            <h2 className="text-gradient" style={{
              fontSize: "56px",
              fontWeight: "700",
              margin: "0 0 24px 0",
              lineHeight: "1.1",
              letterSpacing: "-0.04em"
            }}>
              PRISM TOURNAMENTS
            </h2>

            <p style={{ 
              fontSize: "1.1rem", 
              color: "var(--text-secondary)", 
              marginBottom: "32px",
              lineHeight: "1.6"
            }}>
              Create brackets, manage competitions, and track leaderboards with a modern, fluid experience designed for the next generation of gamers.
            </p>

            {/* Home Stats Column */}
            <div style={{ display: "flex", gap: "40px", marginBottom: "40px", flexWrap: "wrap" }}>
              {stats.map(stat => (
                <div key={stat.label}>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "4px" }}>{stat.label}</div>
                  <div style={{ fontSize: "24px", color: stat.color, fontFamily: "var(--font-mono)" }}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              {isAuthenticated ? (
                <Link href="/tournaments" className="btn btn-primary" style={{ padding: "10px 24px" }}>
                  Browse Events
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", marginLeft: "4px" }}>arrow_forward</span>
                </Link>
              ) : (
                <Link href="/login" className="btn btn-primary" style={{ padding: "10px 24px" }}>
                  Get Started
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", marginLeft: "4px" }}>rocket_launch</span>
                </Link>
              )}
              <Link href="/about" className="btn btn-secondary" style={{ padding: "10px 24px" }}>
                Learn More
              </Link>
            </div>
          </div>

          {/* Decorative radial overlay */}
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

        {/* Feature Grid Section */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "24px",
        }}>
          {features.map((f, i) => (
            <div
              key={i}
              className="glass-card"
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                border: "1px solid var(--border-color)",
                transition: "transform 0.2s ease",
                cursor: "default"
              }}
            >
              <div style={{
                height: "180px",
                backgroundColor: "var(--bg-tertiary)",
                borderRadius: "8px",
                position: "relative",
                overflow: "hidden"
              }}>
                <img
                  src={f.image}
                  alt={f.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.8
                  }}
                />
                <div style={{
                  position: "absolute",
                  bottom: 0, left: 0, right: 0,
                  height: "60%",
                  background: "linear-gradient(to top, var(--background), transparent)"
                }} />
                
                <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                  <span className="badge" style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--border-color)",
                    backdropFilter: "blur(4px)"
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "14px", marginRight: "4px" }}>{f.icon}</span>
                    Core Feature
                  </span>
                </div>
              </div>

              <div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "600" }}>{f.title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5", margin: 0 }}>
                  {f.description}
                </p>
              </div>

              <div style={{ marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--border-color)" }}>
                <Link href="/tournaments" style={{ fontSize: "12px", color: "var(--primary)", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                  EXPLORE <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>trending_flat</span>
                </Link>
              </div>
            </div>
          ))}

          {/* CTA Box */}
          <div style={{
            border: "1px dashed var(--border-color)",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "300px",
            color: "var(--text-muted)",
            gap: "12px",
            textAlign: "center",
            padding: "2rem"
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "40px", color: "var(--primary)" }}>groups</span>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)" }}>Join the Community</div>
              <div style={{ fontSize: "13px", marginTop: "4px" }}>Connect with over 42k players worldwide.</div>
            </div>
            <Link href="/register" className="btn btn-secondary" style={{ marginTop: "1rem", borderRadius: "20px" }}>
              Sign Up Now
            </Link>
          </div>
        </div>
      </div>

      <footer className="footer" style={{ marginTop: "80px", maxWidth: "1200px", margin: "80px auto 0 auto" }}>
        <Link href="/contact" className="footer-link">contact</Link>
        <Link href="/support" className="footer-link">support</Link>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link">github</a>
        <Link href="/terms" className="footer-link">terms</Link>
        <Link href="/privacy" className="footer-link">privacy</Link>
      </footer>
    </div>
  );
}
