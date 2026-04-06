"use client";

import Link from "next/link";
import { Page, Section, Stack } from "@/components/layout";

export default function AboutPage() {
  return (
    <Page>
      {/* Cinematic Hero header matching Settings/Tournaments persona */}
      <header style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "48px",
        flexWrap: "wrap",
        gap: "20px"
      }}>
        <h1 style={{ fontSize: "36px", fontWeight: "300", margin: 0 }}>
          About the Platform
        </h1>
        <div className="glass" style={{
          padding: "8px 16px",
          borderRadius: "24px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          border: "1px solid var(--border-color)",
        }}>
          <span className="material-symbols-outlined" style={{ color: "var(--text-muted)", fontSize: "20px" }}>info</span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>v2.4.0-stable</span>
        </div>
      </header>

      {/* --- Mission Cinematic Card --- */}
      <div
        className="glass-card"
        style={{
          padding: "64px",
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
            opacity: 0.4,
            zIndex: 0,
          }}
        />

        <div style={{ position: "relative", zIndex: 2, maxWidth: "600px" }}>
           <h2 className="text-gradient" style={{ fontSize: "48px", fontWeight: "700", marginBottom: "24px", lineHeight: "1.1" }}>
             ELEVATE YOUR GAME
           </h2>
           <p style={{ fontSize: "1.2rem", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "32px" }}>
             Tournify is a high-performance tournament management platform designed for the modern competitor. We bridge the gap between casual play and professional esports through automated systems and cinematic design.
           </p>
           <div style={{ display: "flex", gap: "12px" }}>
              <Link href="/login" className="btn btn-primary" style={{ padding: "10px 24px" }}>
                 JOIN THE ARENA
              </Link>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "24px" }}>
        
        {/* Core Pillars */}
        <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--border-color)" }}>
           <div className="section-header" style={{ marginBottom: "24px" }}>
             <span className="material-symbols-outlined" style={{ color: "var(--accent-info)" }}>rocket_launch</span>
             <span className="section-title">OUR PILLARS</span>
           </div>
           <div className="stack-md">
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "4px" }}>AUTOMATION FIRST</div>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Brackets, results, and rankings are updated in real-time with zero manual oversight.</p>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px", marginBottom: "4px" }}>FAIR COMPETITION</div>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>Advanced seedings and ranking algorithms ensure every player finds their level.</p>
              </div>
           </div>
        </section>

        {/* Technical Stack */}
        <section className="glass-card" style={{ padding: "32px", border: "1px solid var(--border-color)" }}>
           <div className="section-header" style={{ marginBottom: "24px" }}>
             <span className="material-symbols-outlined" style={{ color: "var(--accent-secondary)" }}>code_blocks</span>
             <span className="section-title">THE STORY</span>
           </div>
           <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: "1.6" }}>
             Born from a shared frustration with legacy bracket tools, Tournify was built from the ground up as a cloud-native, real-time ecosystem. Today, we support thousands of simultaneous tournaments across globally distributed servers.
           </p>
        </section>

      </div>
    </Page>
  );
}
