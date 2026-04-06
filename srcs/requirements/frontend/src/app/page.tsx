"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { isAuthenticated } = useAuth();

  const workflow = [
    {
      label: "Phase 01",
      title: "Establish Organization",
      description: "Define your management node, configure staff roles, and initialize your professional brand infrastructure.",
      icon: "add_business",
    },
    {
      label: "Phase 02",
      title: "Configure Brackets",
      description: "Deploy automated single or double elimination logic. Support for 16, 64, or 256+ participant clusters.",
      icon: "account_tree",
    },
    {
      label: "Phase 03",
      title: "Govern Operations",
      description: "Execute real-time match monitoring, finalize score vectors, and oversee tournament lifecycle from a central command.",
      icon: "dashboard_customize",
    }
  ];

  const stats = [
    { label: "ORGANIZATIONS", value: "842", color: "var(--accent-info)" },
    { label: "ACTIVE_NODES", value: "12,470", color: "var(--text-primary)" },
    { label: "TOURNAMENTS_RUN", value: "3.2k", color: "var(--accent-success)" }
  ];

  return (
    <div className="page" style={{
      minHeight: "100vh",
      color: "var(--text-primary)",
      fontFamily: "var(--font-sans)",
      backgroundColor: "transparent",
    }}>
      
      {/* Cinematic Hero: The Command Center */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(min(400px, 100%), 1fr))", 
        gap: "40px",
        alignItems: "center",
        padding: "clamp(40px, 8vw, 80px) 0",
        position: "relative",
        overflow: "hidden"
      }}>
        
        <div className="stack-xl" style={{ position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
            <span className="badge" style={{ backgroundColor: "var(--accent-secondary)", color: "white" }}>INFRASTRUCTURE_V2</span>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "700", letterSpacing: "2px" }}>MANAGEMENT PORTAL</span>
          </div>

          <h2 className="text-gradient" style={{
            fontSize: "clamp(40px, 8vw, 72px)",
            fontWeight: "900",
            margin: "0 0 24px 0",
            lineHeight: "0.95",
            letterSpacing: "-0.06em",
            textTransform: "uppercase"
          }}>
            Orchestrate<br />Excellence.
          </h2>

          <p style={{ 
            fontSize: "clamp(1rem, 2vw, 1.25rem)", 
            color: "var(--text-secondary)", 
            marginBottom: "40px",
            lineHeight: "1.6",
            maxWidth: "500px"
          }}>
            The definitive infrastructure for tournament coordinators. Establish your organization, deploy professional-grade brackets, and govern participants at scale.
          </p>

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <Link href={isAuthenticated ? "/dashboard" : "/register"} className="btn btn-primary" style={{ padding: "16px 32px", fontSize: "12px", fontWeight: "800", letterSpacing: "1px" }}>
              {isAuthenticated ? "ACCESS COMMAND DASHBOARD" : "ESTABLISH ORGANIZATION"}
              <span className="material-symbols-outlined" style={{ fontSize: "18px", marginLeft: "8px" }}>{isAuthenticated ? "terminal" : "add_business"}</span>
            </Link>
            {!isAuthenticated && (
              <Link href="/login" className="btn btn-secondary" style={{ padding: "16px 32px", fontSize: "12px", borderRadius: "12px" }}>
                RETURN TO COMMAND
              </Link>
            )}
          </div>

          {/* Micro Stats */}
          <div style={{ display: "flex", gap: "clamp(24px, 4vw, 48px)", marginTop: "clamp(32px, 5vw, 60px)", flexWrap: "wrap" }}>
            {stats.map(stat => (
              <div key={stat.label}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "2px", fontWeight: "700" }}>{stat.label}</div>
                <div style={{ fontSize: "clamp(20px, 3vw, 28px)", color: "var(--text-primary)", fontWeight: "300" }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Infrastructure Preview Card - Hidden on very small screens */}
        <div className="hide-mobile" style={{ position: "relative" }}>
          <div className="glass-card" style={{
            padding: "40px",
            border: "1px solid var(--border-color)",
            position: "relative",
            zIndex: 2,
            backdropFilter: "blur(40px)",
            transform: "perspective(1000px) rotateY(-10deg) rotateX(5deg)",
            boxShadow: "20px 40px 80px rgba(0,0,0,0.4)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px" }}>
              <div style={{ background: "var(--accent-info)", width: "12px", height: "12px", borderRadius: "50%" }}></div>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ width: "24px", height: "4px", borderRadius: "2px", background: "var(--border-color)" }}></div>
                <div style={{ width: "48px", height: "4px", borderRadius: "2px", background: "var(--border-color)" }}></div>
              </div>
            </div>
            
            <div className="stack-lg">
              <div style={{ background: "rgba(255,255,255,0.03)", height: "40px", borderRadius: "8px", border: "1px solid var(--border-color)", padding: "12px", display: "flex", alignItems: "center" }}>
                 <div style={{ width: "20%", height: "8px", background: "var(--primary)", borderRadius: "4px" }}></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                 <div style={{ background: "rgba(255,255,255,0.03)", height: "80px", borderRadius: "8px", border: "1px solid var(--border-color)" }}></div>
                 <div style={{ background: "rgba(255,255,255,0.03)", height: "80px", borderRadius: "8px", border: "1px solid var(--border-color)" }}></div>
              </div>
              <div style={{ background: "var(--gradient-prism)", height: "120px", borderRadius: "8px", opacity: 0.1 }}></div>
            </div>

            <div style={{ marginTop: "32px", fontSize: "10px", color: "var(--text-muted)", letterSpacing: "2px", textAlign: "center" }}>SYSTEM_STATUS: OPERATIONAL</div>
          </div>

          {/* Background Glow */}
          <div style={{ 
            position: "absolute", 
            top: "50%", 
            left: "50%", 
            transform: "translate(-50%, -50%)",
            width: "400px", 
            height: "400px", 
            background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)", 
            opacity: 0.2,
            filter: "blur(60px)",
            zIndex: 1 
          }} />
        </div>
      </div>

      {/* Workflow Section */}
      <section style={{ padding: "clamp(40px, 8vw, 100px) 0", borderTop: "1px solid var(--border-color)" }}>
        <div style={{ marginBottom: "clamp(32px, 5vw, 60px)" }}>
          <h3 style={{ fontSize: "10px", color: "var(--primary)", letterSpacing: "4px", fontWeight: "900", marginBottom: "12px" }}>PLATFORM_LIFECYCLE</h3>
          <div style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: "300", color: "var(--text-primary)" }}>Coordination Workflow.</div>
        </div>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", 
          gap: "24px" 
        }}>
          {workflow.map((p, i) => (
            <div key={i} className="glass-card" style={{ padding: "clamp(24px, 4vw, 40px)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "var(--primary)" }}>{p.icon}</span>
                <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "800", letterSpacing: "2px" }}>{p.label}</span>
              </div>
              <div>
                <h4 style={{ fontSize: "clamp(16px, 2vw, 20px)", fontWeight: "700", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "-0.02em" }}>{p.title}</h4>
                <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Area */}
      <div className="glass-card" style={{
        padding: "clamp(40px, 6vw, 80px)",
        textAlign: "center",
        background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.02))",
        border: "1px solid var(--border-color)",
        borderRadius: "32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "32px"
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "var(--primary)" }}>account_balance</span>
        <div className="stack-md">
          <h2 style={{ fontSize: "clamp(24px, 5vw, 40px)", fontWeight: "300", color: "var(--text-primary)" }}>Initialize Your Organization.</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "clamp(0.9rem, 2vw, 1.1rem)", maxWidth: "600px" }}>Connect with the definitively professional management system for tournament coordination.</p>
        </div>
        <Link href="/register" className="btn btn-primary" style={{ padding: "16px 48px", borderRadius: "16px", textTransform: "uppercase", fontWeight: "900", letterSpacing: "2px", fontSize: "12px" }}>
          Create Management Node
        </Link>
      </div>

      <footer className="footer" style={{ marginTop: "clamp(60px, 10vw, 120px)" }}>
        <Link href="/contact" className="footer-link">contact</Link>
        <Link href="/support" className="footer-link">support</Link>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link">github</a>
        <Link href="/terms" className="footer-link">terms</Link>
        <Link href="/privacy" className="footer-link">privacy</Link>
      </footer>
    </div>
  );
}
