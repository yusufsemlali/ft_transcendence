"use client";

import { useEffect, useState } from "react";
import type { Organization, Tournament } from "@ft-transcendence/contracts";
import api from "@/lib/api/api";
import { StatWidget } from "../_components/stat-widget";
import Head from "next/head";

export function TournamentOverviewTab({ tournament, org }: { tournament: Tournament; org: Organization }) {
  const [stats, setStats] = useState({
    participants: 0,
    teams: 0,
    matches: 0,
  });

  const bannerUrl = tournament.bannerUrl || "https://www.pglesports.com/images/CS2_events/PglAstana/topBannerImages/logoPglAstana.webp";

  useEffect(() => {
    // Fetch lobby/tournament stats
    api.tournaments.getLobbyState({ params: { id: tournament.id } })
        .then(res => {
            if (res.status === 200) {
                const state = res.body as any;
                setStats(prev => ({
                    ...prev,
                    participants: state.players?.length || 0,
                    teams: state.teams?.length || 0
                }));
            }
        }).catch(() => {});
  }, [tournament.id]);

  return (
    <div className="animate-fade-in" style={{ width: "100%" }}>
      {/* Preload the banner image with correct 'as' value to fix browser warning */}
      <link rel="preload" href={bannerUrl} as="image" />

      {/* Hero Header */}
      <div className="glass-card" style={{ 
          height: "280px", 
          marginBottom: "24px", 
          position: "relative", 
          overflow: "hidden", 
          padding: 0,
          border: "none",
          background: "var(--background-secondary)"
      }}>
        {/* Background Blur Overlay */}
        <div style={{ 
            position: "absolute", 
            inset: 0, 
            backgroundImage: `url(${bannerUrl})`, 
            backgroundSize: "cover", 
            backgroundPosition: "center",
            filter: "blur(40px) brightness(0.4)",
            transform: "scale(1.1)",
            zIndex: 0
        }} />

        {/* Content */}
        <div style={{ 
            position: "relative", 
            zIndex: 1, 
            height: "100%", 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "flex-end", 
            padding: "40px",
            background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)"
        }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                    <div style={{ 
                        width: "120px", 
                        height: "120px", 
                        borderRadius: "16px", 
                        overflow: "hidden", 
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
                    }}>
                        <img src={bannerUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div>
                        <span style={{ 
                            fontSize: "11px", 
                            fontWeight: 700, 
                            color: "var(--primary)", 
                            letterSpacing: "2px", 
                            textTransform: "uppercase",
                            marginBottom: "8px",
                            display: "block"
                        }}>
                             {tournament.bracketType.replace('_', ' ')} • {tournament.mode}
                        </span>
                        <h2 style={{ fontSize: "32px", fontWeight: 800, color: "white", margin: 0, textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                            {tournament.name}
                        </h2>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.7)", fontSize: "13px" }}>
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>calendar_today</span>
                                <span>{new Date(tournament.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div style={{ padding: "4px 12px", borderRadius: "100px", background: "rgba(255,255,255,0.1)", color: "white", fontSize: "11px", fontWeight: 600, border: "1px solid rgba(255,255,255,0.1)" }}>
                                {tournament.status.toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                    <button className="btn btn-primary" style={{ padding: "12px 32px" }}>
                        Launch Lobby
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-stat-grid" style={{ marginBottom: "24px" }}>
          <StatWidget 
            icon="group" 
            label="PARTICIPANTS" 
            value={`${stats.participants} / ${tournament.maxParticipants}`} 
            accent="var(--accent-info)" 
          />
          <StatWidget 
            icon="groups" 
            label="TEAMS" 
            value={stats.teams.toString()} 
            accent="var(--primary)" 
          />
          <StatWidget 
            icon="scoreboard" 
            label="MATCHES" 
            value={stats.matches.toString()} 
            accent="var(--accent-success)" 
          />
          <StatWidget 
            icon="payments" 
            label="PRIZE POOL" 
            value={tournament.prizePool || "--"} 
            accent="var(--accent-warning)" 
          />
      </div>

      {/* Content Widgets */}
      <div className="dashboard-widget-grid">
          {/* Tournament Feed */}
          <div className="glass-card dashboard-widget">
              <div className="dashboard-widget-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--primary)" }}>notifications</span>
                  <span style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "1px", color: "var(--text-secondary)" }}>EVENT UPDATES</span>
                </div>
              </div>
              <div className="dashboard-widget-body" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", textAlign: "center" }}>
                   <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "var(--text-muted)", opacity: 0.2, marginBottom: "16px" }}>campaign</span>
                   <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No recent announcements for this tournament.</p>
              </div>
          </div>

          {/* Quick Config */}
          <div className="glass-card dashboard-widget">
              <div className="dashboard-widget-header">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent-secondary)" }}>tune</span>
                  <span style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "1px", color: "var(--text-secondary)" }}>EVENT RULES</span>
                </div>
              </div>
              <div className="dashboard-widget-body">
                  <div className="stack-xs" style={{ fontSize: "13px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                          <span style={{ color: "var(--text-muted)" }}>Bracket</span>
                          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{tournament.bracketType.replace('_', ' ')}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                          <span style={{ color: "var(--text-muted)" }}>Registration</span>
                          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{tournament.status === 'registration' ? 'Open' : 'Closed'}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                          <span style={{ color: "var(--text-muted)" }}>Privacy</span>
                          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{tournament.isPrivate ? 'Private' : 'Public'}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
                          <span style={{ color: "var(--text-muted)" }}>Entry Fee</span>
                          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{tournament.entryFee > 0 ? `${tournament.entryFee} Points` : 'Free'}</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
