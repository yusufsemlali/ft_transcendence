"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { Organization, Tournament } from "@ft-transcendence/contracts";
import api from "@/lib/api/api";
import { StatWidget } from "../_components/stat-widget";
import { toast } from "@/components/ui/sonner";

export function TournamentOverviewTab({ tournament, org, onStatusChange, onNavigate }: {
  tournament: Tournament;
  org: Organization;
  onStatusChange?: (updated: Tournament) => void;
  onNavigate?: (page: string) => void;
}) {
  const [stats, setStats] = useState({
    participants: 0,
    teams: 0,
    matches: 0,
  });
  const [confirmLaunch, setConfirmLaunch] = useState(false);

  const bannerUrl = tournament.bannerUrl || "https://www.pglesports.com/images/CS2_events/PglAstana/topBannerImages/logoPglAstana.webp";
  const isDraft = tournament.status === "draft";
  const isRegistration = tournament.status === "registration";

  useEffect(() => {
    if (isDraft) return;
    api.tournaments.getLobbyState({ params: { id: tournament.id } })
        .then(res => {
            if (res.status === 200) {
                const state = res.body as any;
                setStats(prev => ({
                    ...prev,
                    participants: (state.soloPlayers?.length || 0) + (state.competitors?.reduce((sum: number, c: any) => sum + (c.roster?.length || 0), 0) || 0),
                    teams: state.competitors?.length || 0
                }));
            }
        }).catch(() => {});
  }, [tournament.id, isDraft]);

  const launchMutation = useMutation({
    mutationFn: async () => {
      const res = await api.tournaments.updateTournament({
        params: { organizationId: org.id, id: tournament.id },
        body: { status: "registration" as any },
      });
      if (res.status !== 200) throw new Error((res.body as any)?.message || "Failed to launch lobby");
      return (res.body as any).data as Tournament;
    },
    onSuccess: (updated) => {
      toast.success("Lobby launched! Registration is now open.");
      setConfirmLaunch(false);
      onStatusChange?.(updated);
      onNavigate?.("lobby");
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setConfirmLaunch(false);
    },
  });

  return (
    <div className="animate-fade-in" style={{ width: "100%" }}>
      {/* Hero Header */}
      <div className="glass-card" style={{ 
          height: "220px", 
          marginBottom: "20px", 
          position: "relative", 
          overflow: "hidden", 
          padding: 0,
          border: "none",
          background: "var(--background-secondary)"
      }}>
        <div style={{ 
            position: "absolute", 
            top: 0,
            left: 0,
            right: 0,
            height: "100%",
            backgroundImage: `url(${bannerUrl})`, 
            backgroundSize: "cover", 
            backgroundPosition: "center",
            zIndex: 0
        }} />
        
        <div style={{ 
            position: "absolute", 
            inset: 0, 
            background: "linear-gradient(to top, var(--background) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
            zIndex: 1
        }} />

        <div style={{ 
            position: "relative", 
            zIndex: 2, 
            height: "100%", 
            display: "flex", 
            flexDirection: "column", 
            justifyContent: "flex-end", 
            padding: "24px 32px",
        }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{ 
                        width: "100px", 
                        height: "100px", 
                        borderRadius: "12px", 
                        overflow: "hidden", 
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                        flexShrink: 0
                    }}>
                        <img src={bannerUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div>
                        <span style={{ 
                            fontSize: "10px", 
                            fontWeight: 700, 
                            color: "var(--primary)", 
                            letterSpacing: "2px", 
                            textTransform: "uppercase",
                            marginBottom: "4px",
                            display: "block"
                        }}>
                             {tournament.bracketType.replace('_', ' ')} &bull; {tournament.mode}
                        </span>
                        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "white", margin: 0, textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
                            {tournament.name}
                        </h2>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>calendar_today</span>
                                <span>{new Date(tournament.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div style={{
                                padding: "3px 10px",
                                borderRadius: "100px",
                                background: isDraft ? "rgba(255,255,255,0.15)" : "var(--primary)",
                                color: "white",
                                fontSize: "10px",
                                fontWeight: 700,
                            }}>
                                {tournament.status.toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action buttons based on status */}
                <div style={{ display: "flex", gap: "10px" }}>
                    {isDraft && !confirmLaunch && (
                      <button
                        className="btn btn-primary"
                        style={{ padding: "10px 24px" }}
                        onClick={() => setConfirmLaunch(true)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>rocket_launch</span>
                        Launch Lobby
                      </button>
                    )}
                    {isDraft && confirmLaunch && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", textAlign: "right" }}>
                          This will open registration{!tournament.isPrivate ? " and make the tournament public" : ""}. Continue?
                        </span>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "6px 14px", fontSize: "11px" }}
                            onClick={() => setConfirmLaunch(false)}
                            disabled={launchMutation.isPending}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn btn-primary"
                            style={{ padding: "6px 14px", fontSize: "11px" }}
                            onClick={() => launchMutation.mutate()}
                            disabled={launchMutation.isPending}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>check</span>
                            {launchMutation.isPending ? "Launching..." : "Confirm Launch"}
                          </button>
                        </div>
                      </div>
                    )}
                    {isRegistration && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: "10px 24px" }}
                        onClick={() => onNavigate?.("lobby")}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>groups</span>
                        View Lobby
                      </button>
                    )}
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
