"use client";

import { useState } from "react";

export default function LeaderboardPage() {
  const topPlayers = [
    { rank: 2, name: "NeonStriker", points: "15,420", avatar: "/images/val.jpeg", elo: 2450 },
    { rank: 1, name: "PrismMaster", points: "18,910", avatar: "/images/leage.jpeg", elo: 2800 },
    { rank: 3, name: "ShadowWalker", points: "14,200", avatar: "/images/cs2.jpeg", elo: 2310 },
  ];

  const ranks = [
    { rank: 4, name: "Zenith", game: "League", elo: 2100, wins: 142, ratio: "68%" },
    { rank: 5, name: "Quantum", game: "Valorant", elo: 2050, wins: 128, ratio: "64%" },
    { rank: 6, name: "Nova", game: "CS2", elo: 1980, wins: 115, ratio: "61%" },
    { rank: 7, name: "Apex", game: "Dota 2", elo: 1920, wins: 98, ratio: "59%" },
    { rank: 8, name: "Vortex", game: "Overwatch", elo: 1850, wins: 85, ratio: "57%" },
  ];

  return (
    <div className="page" style={{
      minHeight: "100vh",
      color: "var(--text-primary)",
      fontFamily: "var(--font-sans)",
      backgroundColor: "transparent",
    }}>
        <header style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "48px",
          flexWrap: "wrap",
          gap: "20px"
        }}>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 36px)", fontWeight: "300", margin: 0 }}>
            Global Rankings
          </h1>
          <div className="glass" style={{
            padding: "8px 16px",
            borderRadius: "24px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border: "1px solid var(--border-color)",
          }}>
            <span className="material-symbols-outlined" style={{ color: "var(--text-muted)", fontSize: "20px" }}>leaderboard</span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Season 4 • Live Updates</span>
          </div>
        </header>

        {/* Podium Section */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
          gap: "24px",
          marginBottom: "64px",
          alignItems: "end"
        }}>
          {topPlayers.map((player) => (
            <div
              key={player.rank}
              className="glass-card"
              style={{
                padding: player.rank === 1 ? "clamp(32px, 4vw, 48px)" : "clamp(24px, 3vw, 32px)",
                textAlign: "center",
                border: player.rank === 1 ? "2px solid var(--primary)" : "1px solid var(--border-color)",
                position: "relative",
                overflow: "hidden",
                order: player.rank === 1 ? -1 : player.rank,
              }}
            >
              {player.rank === 1 && (
                <div style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px"
                }}>
                   <span className="badge" style={{ backgroundColor: "var(--accent-secondary)", color: "white" }}>CHAMPION</span>
                </div>
              )}

              <div style={{
                width: player.rank === 1 ? "clamp(80px, 12vw, 120px)" : "clamp(60px, 10vw, 80px)",
                height: player.rank === 1 ? "clamp(80px, 12vw, 120px)" : "clamp(60px, 10vw, 80px)",
                borderRadius: "50%",
                margin: "0 auto 20px auto",
                border: `3px solid ${player.rank === 1 ? "var(--primary)" : "var(--border-color)"}`,
                background: `url(${player.avatar}) center/cover no-repeat`,
                boxShadow: "var(--shadow-glass)"
              }} />

              <div style={{ fontSize: "12px", color: "var(--text-muted)", letterSpacing: "2px", fontWeight: "600" }}>RANK #{player.rank}</div>
              <h2 className={player.rank === 1 ? "text-gradient" : ""} style={{ fontSize: player.rank === 1 ? "clamp(24px, 4vw, 32px)" : "clamp(18px, 3vw, 24px)", fontWeight: "700", margin: "8px 0" }}>
                {player.name}
              </h2>

              <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "16px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px" }}>POINTS</div>
                  <div style={{ fontSize: "18px", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{player.points}</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "1px" }}>ELO RATING</div>
                  <div style={{ fontSize: "18px", color: "var(--accent-success)", fontFamily: "var(--font-mono)" }}>{player.elo}</div>
                </div>
              </div>

              {player.rank === 1 && (
                <div style={{ 
                  position: "absolute", 
                  bottom: "-20%", 
                  left: "-10%", 
                  width: "150px", height: "150px", 
                  background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)", 
                  opacity: 0.1 
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Tiers List Section — Mobile-responsive card layout */}
        <div className="stack-md">
          {/* Desktop table header - hidden on mobile */}
          <div className="hide-mobile" style={{ 
            display: "grid", 
            gridTemplateColumns: "80px 1fr 120px 120px 100px 100px", 
            padding: "0 24px", 
            marginBottom: "12px",
            color: "var(--text-muted)",
            fontSize: "10px",
            letterSpacing: "1px",
            fontWeight: "700"
          }}>
            <div>RANK</div>
            <div>PLAYER ALIAS</div>
            <div>MAIN GAME</div>
            <div style={{ textAlign: "right" }}>ELO RATING</div>
            <div style={{ textAlign: "right" }}>WINS</div>
            <div style={{ textAlign: "right" }}>WIN RATE</div>
          </div>

          {ranks.map((r) => (
            <div
              key={r.rank}
              className="glass-card leaderboard-row"
              style={{
                padding: "20px 24px",
                border: "1px solid var(--border-color)",
                transition: "transform 0.2s ease"
              }}
            >
              {/* Desktop: 6-column grid row */}
              <div className="hide-mobile" style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 120px 120px 100px 100px",
                alignItems: "center",
              }}>
                <div style={{ fontSize: "18px", fontWeight: "700", opacity: 0.5 }}>#{r.rank}</div>
                <div style={{ fontWeight: "600", fontSize: "16px" }}>{r.name}</div>
                <div style={{ fontSize: "12px", color: "var(--accent-info)", fontWeight: "600" }}>{r.game}</div>
                <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--accent-success)" }}>{r.elo}</div>
                <div style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{r.wins}</div>
                <div style={{ textAlign: "right", color: "var(--text-secondary)" }}>{r.ratio}</div>
              </div>

              {/* Mobile: stacked card layout */}
              <div className="show-mobile" style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ fontSize: "18px", fontWeight: "700", opacity: 0.5 }}>#{r.rank}</div>
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "16px" }}>{r.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--accent-info)", fontWeight: "600" }}>{r.game}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-mono)", color: "var(--accent-success)", fontSize: "16px" }}>{r.elo}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{r.wins}W · {r.ratio}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
    </div>
  );
}
