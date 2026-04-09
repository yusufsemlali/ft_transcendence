"use client";

import type { CSSProperties } from "react";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Organization, Tournament } from "@ft-transcendence/contracts";
import api from "@/lib/api/api";
import { useAuth } from "@/lib/store/hooks";
import { toast } from "@/components/ui/sonner";
import { formatApiErrorBody } from "@/lib/api-error";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ═══════════════════════════════════════
   TYPES  (mirrors the new contracts)
   ═══════════════════════════════════════ */

interface SoloPlayer {
  userId: string;
  username: string;
  avatarUrl: string | null;
  status: "solo" | "rostered" | "spectator";
  joinedAt: string;
}

interface RosterMember {
  userId: string;
  username: string;
  role: "captain" | "player" | "substitute";
}

interface Competitor {
  id: string;
  name: string;
  status: "incomplete" | "ready" | "disqualified";
  roster: RosterMember[];
}

interface LobbyState {
  soloPlayers: SoloPlayer[];
  competitors: Competitor[];
}

type MyStatus = "outside" | "solo" | "rostered" | "spectator";

function staffMenuTriggerStyle(): CSSProperties {
  return { padding: "4px 8px", minWidth: "32px", display: "inline-flex", alignItems: "center", justifyContent: "center" };
}

/* ═══════════════════════════════════════
   CAPACITY BAR
   ═══════════════════════════════════════ */

function LobbyCapacityBar({ readyCount, max, registrationOpen }: {
  readyCount: number;
  max: number;
  registrationOpen: boolean;
}) {
  const pct = max > 0 ? Math.min((readyCount / max) * 100, 100) : 0;
  const isFull = readyCount >= max;

  return (
    <div className="glass-card" style={{ padding: "16px 20px", marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--primary)" }}>groups</span>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Lobby Capacity</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "20px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
            {readyCount}
          </span>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>/ {max}</span>
          <span className="dashboard-status-badge" style={{
            background: isFull
              ? "color-mix(in srgb, var(--destructive) 15%, transparent)"
              : registrationOpen
                ? "color-mix(in srgb, var(--accent-success) 15%, transparent)"
                : "color-mix(in srgb, var(--text-muted) 15%, transparent)",
            color: isFull ? "var(--destructive)" : registrationOpen ? "var(--accent-success)" : "var(--text-muted)",
          }}>
            {isFull ? "Full" : registrationOpen ? "Open" : "Closed"}
          </span>
        </div>
      </div>
      <div style={{
        height: "6px",
        borderRadius: "3px",
        background: "rgba(255,255,255,0.05)",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: "3px",
          background: isFull ? "var(--destructive)" : "var(--primary)",
          transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   CREATE TEAM INLINE
   ═══════════════════════════════════════ */

function CreateTeamInline({ onSubmit, submitting }: {
  onSubmit: (name: string) => void;
  submitting: boolean;
}) {
  const [name, setName] = useState("");

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Team name..."
        className="dashboard-input"
        style={{ flex: 1, fontSize: "13px", padding: "8px 12px" }}
        onKeyDown={e => { if (e.key === "Enter" && name.trim()) onSubmit(name.trim()); }}
      />
      <button
        className="btn btn-primary"
        style={{ fontSize: "11px", padding: "8px 16px", whiteSpace: "nowrap" }}
        onClick={() => { if (name.trim()) onSubmit(name.trim()); }}
        disabled={submitting || !name.trim()}
      >
        {submitting ? "Creating..." : "Create Team"}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════
   SOLO PLAYER CARD
   ═══════════════════════════════════════ */

function SoloPlayerCard({ player, canInvite, myCompetitorId, onInvite, inviting, isTO, onEject, ejecting }: {
  player: SoloPlayer;
  canInvite: boolean;
  myCompetitorId: string | null;
  onInvite: (userId: string) => void;
  inviting: boolean;
  isTO: boolean;
  onEject: (userId: string) => void;
  ejecting: boolean;
}) {
  const showActions = isTO || (canInvite && !!myCompetitorId);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 14px",
      borderBottom: "1px solid var(--border-color)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: player.avatarUrl ? `url(${player.avatarUrl}) center/cover no-repeat` : "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          flexShrink: 0,
        }}>
          {!player.avatarUrl && (
            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--text-muted)" }}>person</span>
          )}
        </div>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{player.username}</div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Looking for team</div>
        </div>
      </div>
      {showActions && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          {canInvite && myCompetitorId && (
            <button
              className="btn btn-secondary"
              style={{ fontSize: "10px", padding: "4px 10px" }}
              onClick={() => onInvite(player.userId)}
              disabled={inviting}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>person_add</span>
              Invite
            </button>
          )}
          {isTO && (
            <DropdownMenu>
              <DropdownMenuTrigger
                type="button"
                className="btn btn-secondary"
                style={staffMenuTriggerStyle()}
                disabled={ejecting}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>more_vert</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4}>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={ejecting}
                    onClick={() => {
                      if (typeof window !== "undefined" && window.confirm(`Remove ${player.username} from the lobby entirely?`)) {
                        onEject(player.userId);
                      }
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>person_remove</span>
                    Remove from lobby
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   ROSTER ROW (team mode, staff actions)
   ═══════════════════════════════════════ */

function LobbyRosterRow({
  member,
  competitorId,
  isTO,
  onRemoveFromTeam,
  onEjectFromLobby,
  removeBusy,
  ejectBusy,
}: {
  member: RosterMember;
  competitorId: string;
  isTO: boolean;
  onRemoveFromTeam: (competitorId: string, userId: string) => void;
  onEjectFromLobby: (userId: string) => void;
  removeBusy: boolean;
  ejectBusy: boolean;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "6px 10px",
      borderRadius: "6px",
      background: "rgba(255,255,255,0.02)",
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "var(--text-muted)" }}>person</span>
      <span style={{ fontSize: "12px", color: "var(--text-primary)", flex: 1 }}>{member.username}</span>
      {member.role === "captain" && (
        <span style={{
          fontSize: "9px",
          fontWeight: 700,
          color: "var(--accent-warning)",
          letterSpacing: "1px",
          padding: "2px 6px",
          borderRadius: "4px",
          background: "color-mix(in srgb, var(--accent-warning) 10%, transparent)",
        }}>
          CPT
        </span>
      )}
      {isTO && (
        <DropdownMenu>
          <DropdownMenuTrigger
            type="button"
            className="btn btn-secondary"
            style={{ padding: "2px 6px", minWidth: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            disabled={removeBusy || ejectBusy}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>more_vert</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4}>
            <DropdownMenuGroup>
              <DropdownMenuItem
                disabled={removeBusy}
                onClick={() => {
                  if (typeof window !== "undefined" && window.confirm(`Remove ${member.username} from this team? They will return to free agents.`)) {
                    onRemoveFromTeam(competitorId, member.userId);
                  }
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>group_remove</span>
                Remove from team
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={ejectBusy}
                onClick={() => {
                  if (typeof window !== "undefined" && window.confirm(`Remove ${member.username} from the lobby entirely?`)) {
                    onEjectFromLobby(member.userId);
                  }
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>person_remove</span>
                Remove from lobby
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   COMPETITOR CARD (Team mode)
   ═══════════════════════════════════════ */

function CompetitorCard({
  competitor,
  isMyTeam,
  isTO,
  onForceReady,
  forcing,
  onRemoveFromTeam,
  onEjectFromLobby,
  isRemoveMemberPending,
  isEjectPending,
}: {
  competitor: Competitor;
  isMyTeam: boolean;
  isTO: boolean;
  onForceReady: (id: string) => void;
  forcing: boolean;
  onRemoveFromTeam: (competitorId: string, userId: string) => void;
  onEjectFromLobby: (userId: string) => void;
  isRemoveMemberPending: (competitorId: string, userId: string) => boolean;
  isEjectPending: (userId: string) => boolean;
}) {
  const isReady = competitor.status === "ready";
  const isDisqualified = competitor.status === "disqualified";

  return (
    <div className="glass-card" style={{
      padding: "16px",
      border: isMyTeam
        ? "1px solid color-mix(in srgb, var(--primary) 40%, transparent)"
        : isDisqualified
          ? "1px solid color-mix(in srgb, var(--destructive) 30%, transparent)"
          : "1px solid var(--border-color)",
      background: isMyTeam ? "color-mix(in srgb, var(--primary) 3%, transparent)" : undefined,
      opacity: isDisqualified ? 0.6 : 1,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px", color: isMyTeam ? "var(--primary)" : "var(--text-muted)" }}>
            shield
          </span>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{competitor.name}</span>
          {isMyTeam && (
            <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--primary)", letterSpacing: "1px" }}>YOU</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <span className="dashboard-status-badge" style={{
            background: isReady
              ? "color-mix(in srgb, var(--accent-success) 15%, transparent)"
              : isDisqualified
                ? "color-mix(in srgb, var(--destructive) 15%, transparent)"
                : "color-mix(in srgb, var(--accent-warning) 15%, transparent)",
            color: isReady ? "var(--accent-success)" : isDisqualified ? "var(--destructive)" : "var(--accent-warning)",
          }}>
            {isReady ? "Ready" : isDisqualified ? "Disqualified" : "Incomplete"}
          </span>
          {isTO && competitor.status === "incomplete" && (
            <DropdownMenu>
              <DropdownMenuTrigger
                type="button"
                className="btn btn-secondary"
                style={staffMenuTriggerStyle()}
                disabled={forcing}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>more_vert</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4}>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    disabled={forcing}
                    onClick={() => onForceReady(competitor.id)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>bolt</span>
                    Force ready
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {competitor.roster.map(member => (
          <LobbyRosterRow
            key={member.userId}
            member={member}
            competitorId={competitor.id}
            isTO={isTO}
            onRemoveFromTeam={onRemoveFromTeam}
            onEjectFromLobby={onEjectFromLobby}
            removeBusy={isRemoveMemberPending(competitor.id, member.userId)}
            ejectBusy={isEjectPending(member.userId)}
          />
        ))}
        {competitor.roster.length === 0 && (
          <div style={{ fontSize: "12px", color: "var(--text-muted)", padding: "8px 0", textAlign: "center" }}>
            No members yet
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   1v1 ENTRANT CARD
   ═══════════════════════════════════════ */

function EntrantCard({
  competitor,
  isTO,
  onForceReady,
  onEject,
  forcing,
  ejecting,
}: {
  competitor: Competitor;
  isTO: boolean;
  onForceReady: (competitorId: string) => void;
  onEject: (userId: string) => void;
  forcing: boolean;
  ejecting: boolean;
}) {
  const player = competitor.roster[0];
  const isReady = competitor.status === "ready";
  const targetUserId = player?.userId;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 14px",
      borderBottom: "1px solid var(--border-color)",
      gap: "8px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--text-muted)" }}>person</span>
        </div>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
          {player?.username || competitor.name}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <span className="dashboard-status-badge" style={{
          background: isReady
            ? "color-mix(in srgb, var(--accent-success) 15%, transparent)"
            : "color-mix(in srgb, var(--accent-warning) 15%, transparent)",
          color: isReady ? "var(--accent-success)" : "var(--accent-warning)",
          fontSize: "10px",
        }}>
          {isReady ? "Registered" : "Pending"}
        </span>
        {isTO && targetUserId && (
          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className="btn btn-secondary"
              style={staffMenuTriggerStyle()}
              disabled={forcing || ejecting}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>more_vert</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={4}>
              <DropdownMenuGroup>
                {!isReady && (
                  <DropdownMenuItem disabled={forcing} onClick={() => onForceReady(competitor.id)}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>bolt</span>
                    Force ready
                  </DropdownMenuItem>
                )}
                {!isReady && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  variant="destructive"
                  disabled={ejecting}
                  onClick={() => {
                    const name = player?.username || "this player";
                    if (typeof window !== "undefined" && window.confirm(`Remove ${name} from the lobby entirely?`)) {
                      onEject(targetUserId);
                    }
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>person_remove</span>
                  Remove from lobby
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN LOBBY TAB
   ═══════════════════════════════════════ */

export function LobbyTab({ tournament, org }: { tournament: Tournament; org: Organization }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  const [showCreateTeam, setShowCreateTeam] = useState(false);

  const is1v1 = tournament.maxTeamSize === 1;
  const registrationOpen = tournament.status === "registration";
  const queryKey = ["lobby", tournament.id];

  // ── Resolve org role ──
  // Any org member is "staff" and cannot participate — only manage.
  // owner/admin get elevated TO controls (force-ready, assign).
  const { data: orgMembers } = useQuery({
    queryKey: ["org-members", org.id],
    queryFn: async () => {
      const res = await api.organizations.getOrganizationMembers({ params: { id: org.id } });
      if (res.status === 200) return res.body.data as Array<{ id: string; orgRole: string }>;
      return [];
    },
    staleTime: 60_000,
  });

  const myOrgRole = useMemo(() => {
    if (!orgMembers || !userId) return null;
    return orgMembers.find(m => m.id === userId)?.orgRole ?? null;
  }, [orgMembers, userId]);

  const isStaff = myOrgRole !== null;
  const isTO = myOrgRole === "owner" || myOrgRole === "admin";

  // ── Poll lobby state ──
  const { data: lobby, isLoading } = useQuery<LobbyState>({
    queryKey,
    queryFn: async () => {
      const res = await api.tournaments.getLobbyState({ params: { id: tournament.id } });
      if (res.status === 200) return res.body as unknown as LobbyState;
      throw new Error("Failed to fetch lobby");
    },
    refetchInterval: 5000,
  });

  // ── Derive user status ──
  const derived = useMemo(() => {
    if (!lobby || !userId) return { myStatus: "outside" as MyStatus, myCompetitor: null as Competitor | null, isCaptain: false };

    const inSolo = lobby.soloPlayers.find(p => p.userId === userId);
    if (inSolo) {
      return {
        myStatus: inSolo.status as MyStatus,
        myCompetitor: null as Competitor | null,
        isCaptain: false,
      };
    }

    for (const comp of lobby.competitors) {
      const member = comp.roster.find(m => m.userId === userId);
      if (member) {
        return {
          myStatus: "rostered" as MyStatus,
          myCompetitor: comp,
          isCaptain: member.role === "captain",
        };
      }
    }

    return { myStatus: "outside" as MyStatus, myCompetitor: null as Competitor | null, isCaptain: false };
  }, [lobby, userId]);

  const { myStatus, myCompetitor, isCaptain } = derived;
  const readyCount = lobby?.competitors.filter(c => c.status === "ready").length ?? 0;

  // ── Mutations ──
  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await api.tournaments.joinLobby({ params: { id: tournament.id }, body: {} });
      if (res.status !== 201) {
        throw new Error(formatApiErrorBody(res.body, "Failed to join"));
      }
      return res.body;
    },
    onSuccess: (data) => {
      toast.success(data.state === "COMPETITOR_CREATED" ? "Registered!" : "Joined lobby!");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createCompetitorMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.tournaments.createCompetitor({ params: { id: tournament.id }, body: { name } });
      if (res.status !== 201) {
        throw new Error(formatApiErrorBody(res.body, "Failed to create team"));
      }
      return res.body;
    },
    onSuccess: () => {
      toast.success("Team created!");
      setShowCreateTeam(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const inviteMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!myCompetitor) throw new Error("No team");
      const res = await api.tournaments.inviteToCompetitor({
        params: { id: tournament.id, competitorId: myCompetitor.id },
        body: { targetUserId },
      });
      if (res.status !== 201) {
        throw new Error(formatApiErrorBody(res.body, "Failed to invite"));
      }
    },
    onSuccess: () => {
      toast.success("Invite sent!");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const leaveLobbyMutation = useMutation({
    mutationFn: async () => {
      const res = await api.tournaments.leaveLobby({ params: { id: tournament.id }, body: {} });
      if (res.status !== 200) {
        throw new Error(formatApiErrorBody(res.body, "Failed to leave"));
      }
    },
    onSuccess: () => {
      toast.success("Left lobby");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const leaveCompetitorMutation = useMutation({
    mutationFn: async () => {
      if (!myCompetitor) throw new Error("Not on a team");
      const res = await api.tournaments.leaveCompetitor({
        params: { id: tournament.id, competitorId: myCompetitor.id },
        body: {},
      });
      if (res.status !== 200) {
        throw new Error(formatApiErrorBody(res.body, "Failed to leave team"));
      }
    },
    onSuccess: () => {
      toast.success("Left team");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const forceReadyMutation = useMutation({
    mutationFn: async (competitorId: string) => {
      const res = await api.tournaments.forceReadyCompetitor({
        params: { id: tournament.id, competitorId },
        body: {},
      });
      if (res.status !== 200) {
        throw new Error(formatApiErrorBody(res.body, "Failed to force ready"));
      }
    },
    onSuccess: () => {
      toast.success("Competitor set to ready");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ejectFromLobbyMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const res = await api.tournaments.ejectFromLobby({
        params: { id: tournament.id },
        body: { targetUserId },
      });
      if (res.status !== 200) {
        throw new Error(formatApiErrorBody(res.body, "Failed to remove player"));
      }
    },
    onSuccess: () => {
      toast.success("Player removed from lobby");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (p: { competitorId: string; targetUserId: string }) => {
      const res = await api.tournaments.removeCompetitorMember({
        params: { id: tournament.id, competitorId: p.competitorId },
        body: { targetUserId: p.targetUserId },
      });
      if (res.status !== 200) {
        throw new Error(formatApiErrorBody(res.body, "Failed to remove from team"));
      }
    },
    onSuccess: () => {
      toast.success("Removed from team");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Loading state ──
  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0" }}>
        <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "var(--primary)", animation: "spin 1s linear infinite" }}>progress_activity</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* ── Capacity Bar ── */}
      <LobbyCapacityBar
        readyCount={readyCount}
        max={tournament.maxParticipants}
        registrationOpen={registrationOpen}
      />

      {/* ── Action Bar ── */}
      <div className="glass-card" style={{ padding: "16px 20px", marginBottom: "16px" }}>
        {isStaff ? (
          /* ── Staff view: management header, never a join button ── */
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--accent-warning)" }}>
                admin_panel_settings
              </span>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                  Staff View
                  <span className="dashboard-status-badge" style={{
                    marginLeft: "8px",
                    background: "color-mix(in srgb, var(--accent-warning) 15%, transparent)",
                    color: "var(--accent-warning)",
                    fontSize: "9px",
                    textTransform: "uppercase" as const,
                    letterSpacing: "1px",
                  }}>
                    {myOrgRole}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {isTO
                    ? "You have full lobby controls. Use the ⋮ menus on free agents, teams, and roster rows to moderate."
                    : "You are viewing as organization staff. Staff cannot participate in their own tournaments."}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.5px" }}>SOLO</div>
                <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                  {lobby?.soloPlayers.length ?? 0}
                </div>
              </div>
              {!is1v1 && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.5px" }}>TEAMS</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                    {lobby?.competitors.length ?? 0}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Player view: contextual actions based on lobby status ── */
          <>
            {myStatus === "outside" && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
                    {registrationOpen ? "Join the Tournament Lobby" : "Registration Closed"}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {registrationOpen
                      ? is1v1
                        ? "Enter to register as a participant."
                        : "Enter the lobby to find or create a team."
                      : "This tournament is no longer accepting new participants."}
                  </div>
                </div>
                {registrationOpen && (
                  <button
                    className="btn btn-primary"
                    style={{ padding: "10px 24px", fontSize: "12px", whiteSpace: "nowrap" }}
                    onClick={() => joinMutation.mutate()}
                    disabled={joinMutation.isPending}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>login</span>
                    {joinMutation.isPending ? "Joining..." : is1v1 ? "Register" : "Enter Lobby"}
                  </button>
                )}
              </div>
            )}

            {myStatus === "solo" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showCreateTeam ? "12px" : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--accent-info)" }}>explore</span>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Looking for a Team</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Create your own team or wait for an invite from a captain.</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {!showCreateTeam && (
                      <button
                        className="btn btn-primary"
                        style={{ fontSize: "11px", padding: "8px 16px", whiteSpace: "nowrap" }}
                        onClick={() => setShowCreateTeam(true)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>add</span>
                        Create Team
                      </button>
                    )}
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: "11px", padding: "8px 12px", whiteSpace: "nowrap" }}
                      onClick={() => leaveLobbyMutation.mutate()}
                      disabled={leaveLobbyMutation.isPending}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>logout</span>
                      Leave
                    </button>
                  </div>
                </div>
                {showCreateTeam && (
                  <CreateTeamInline
                    onSubmit={(name) => createCompetitorMutation.mutate(name)}
                    submitting={createCompetitorMutation.isPending}
                  />
                )}
              </div>
            )}

            {myStatus === "spectator" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--text-muted)" }}>visibility</span>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Spectating</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Registration has closed. You are watching as a spectator.</div>
                </div>
              </div>
            )}

            {myStatus === "rostered" && myCompetitor && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--primary)" }}>shield</span>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {myCompetitor.name}
                      <span className="dashboard-status-badge" style={{
                        marginLeft: "8px",
                        background: myCompetitor.status === "ready"
                          ? "color-mix(in srgb, var(--accent-success) 15%, transparent)"
                          : "color-mix(in srgb, var(--accent-warning) 15%, transparent)",
                        color: myCompetitor.status === "ready" ? "var(--accent-success)" : "var(--accent-warning)",
                      }}>
                        {myCompetitor.status === "ready" ? "Ready" : "Incomplete"}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {myCompetitor.roster.length} member{myCompetitor.roster.length !== 1 ? "s" : ""}
                      {isCaptain && " · You are the captain"}
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: "11px", padding: "8px 12px", whiteSpace: "nowrap" }}
                  onClick={() => leaveCompetitorMutation.mutate()}
                  disabled={leaveCompetitorMutation.isPending}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>logout</span>
                  {leaveCompetitorMutation.isPending ? "Leaving..." : "Leave Team"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Lobby Grid ── */}
      {is1v1 ? (
        /* 1v1 mode: single participant list */
        <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--primary)" }}>person</span>
              <span style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "1px", color: "var(--text-secondary)" }}>
                PARTICIPANTS ({lobby?.competitors.length ?? 0})
              </span>
            </div>
          </div>
          {lobby?.competitors.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "var(--text-muted)", opacity: 0.2, marginBottom: "12px", display: "block" }}>group_off</span>
              <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No participants yet. Be the first to register!</p>
            </div>
          ) : (
            lobby?.competitors.map(comp => (
              <EntrantCard
                key={comp.id}
                competitor={comp}
                isTO={isTO}
                onForceReady={(id) => forceReadyMutation.mutate(id)}
                onEject={(uid) => ejectFromLobbyMutation.mutate(uid)}
                forcing={forceReadyMutation.isPending && forceReadyMutation.variables === comp.id}
                ejecting={ejectFromLobbyMutation.isPending
                  && ejectFromLobbyMutation.variables === comp.roster[0]?.userId}
              />
            ))
          )}
        </div>
      ) : (
        /* Team mode: two-column grid */
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))",
          gap: "16px",
        }}>
          {/* Solo Players */}
          <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent-info)" }}>person_search</span>
                <span style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "1px", color: "var(--text-secondary)" }}>
                  FREE AGENTS ({lobby?.soloPlayers.length ?? 0})
                </span>
              </div>
            </div>
            {lobby?.soloPlayers.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "var(--text-muted)", opacity: 0.2, marginBottom: "12px", display: "block" }}>group_off</span>
                <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No free agents in the lobby.</p>
              </div>
            ) : (
              lobby?.soloPlayers.map(player => (
                <SoloPlayerCard
                  key={player.userId}
                  player={player}
                  canInvite={isCaptain || isTO}
                  myCompetitorId={myCompetitor?.id ?? null}
                  onInvite={(uid) => inviteMutation.mutate(uid)}
                  inviting={inviteMutation.isPending}
                  isTO={isTO}
                  onEject={(uid) => ejectFromLobbyMutation.mutate(uid)}
                  ejecting={ejectFromLobbyMutation.isPending && ejectFromLobbyMutation.variables === player.userId}
                />
              ))
            )}
          </div>

          {/* Competitors */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 4px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--primary)" }}>groups</span>
              <span style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "1px", color: "var(--text-secondary)" }}>
                TEAMS ({lobby?.competitors.length ?? 0})
              </span>
            </div>
            {lobby?.competitors.length === 0 ? (
              <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "var(--text-muted)", opacity: 0.2, marginBottom: "12px", display: "block" }}>shield</span>
                <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No teams formed yet.</p>
              </div>
            ) : (
              lobby?.competitors.map(comp => (
                <CompetitorCard
                  key={comp.id}
                  competitor={comp}
                  isMyTeam={myCompetitor?.id === comp.id}
                  isTO={isTO}
                  onForceReady={(id) => forceReadyMutation.mutate(id)}
                  forcing={forceReadyMutation.isPending && forceReadyMutation.variables === comp.id}
                  onRemoveFromTeam={(competitorId, targetUserId) =>
                    removeMemberMutation.mutate({ competitorId, targetUserId })}
                  onEjectFromLobby={(uid) => ejectFromLobbyMutation.mutate(uid)}
                  isRemoveMemberPending={(competitorId, targetUserId) =>
                    removeMemberMutation.isPending
                    && removeMemberMutation.variables?.competitorId === competitorId
                    && removeMemberMutation.variables?.targetUserId === targetUserId}
                  isEjectPending={(uid) =>
                    ejectFromLobbyMutation.isPending && ejectFromLobbyMutation.variables === uid}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
