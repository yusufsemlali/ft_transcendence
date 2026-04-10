"use client";

import type { CSSProperties } from "react";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Organization } from "@ft-transcendence/contracts";

interface LobbyTournament {
  id: string;
  status: string;
  maxTeamSize: number;
  lobbyCapacity: number;
}
import api from "@/lib/api/api";
import { useAuth } from "@/lib/store/hooks";
import { toast } from "@/components/ui/sonner";
import { formatApiErrorBody } from "@/lib/api-error";
import { addSseNotificationListener } from "@/hooks/use-notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ═══════════════════════════════════════
   TYPES
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

interface PendingInvite {
  inviteId: string;
  competitorId: string;
  competitorName: string;
  inviterUsername: string;
  createdAt: string;
}

interface OutgoingInviteRef {
  inviteId: string;
  targetUserId: string;
}

interface LobbyState {
  soloPlayers: SoloPlayer[];
  competitors: Competitor[];
  pendingInvites?: PendingInvite[];
  outgoingInvites?: OutgoingInviteRef[];
}

type MyStatus = "outside" | "solo" | "rostered" | "spectator";

function staffMenuTriggerStyle(): CSSProperties {
  return { padding: "4px 8px", minWidth: "32px", display: "inline-flex", alignItems: "center", justifyContent: "center" };
}

/* ═══════════════════════════════════════
   PHASE LOCK BANNER
   ═══════════════════════════════════════ */

function PhaseLockBanner() {
  return (
    <div className="glass-card" style={{
      padding: "12px 16px",
      marginBottom: "16px",
      border: "1px solid color-mix(in srgb, var(--accent-warning) 30%, transparent)",
      background: "color-mix(in srgb, var(--accent-warning) 5%, transparent)",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--accent-warning)" }}>lock</span>
      <div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Registration Closed</div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Rosters are locked. Only tournament organizers can make changes.</div>
      </div>
    </div>
  );
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
      <div style={{ height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
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
   SOLO PLAYER CARD (Left pane)
   ═══════════════════════════════════════ */

function soloInviteButtonStyle(phase: "idle" | "sending" | "sent"): CSSProperties {
  if (phase === "sent") {
    return {
      position: "relative",
      overflow: "hidden",
      border: "1px solid color-mix(in srgb, var(--accent-success) 40%, transparent)",
      background: "linear-gradient(145deg, color-mix(in srgb, var(--accent-success) 16%, transparent) 0%, color-mix(in srgb, var(--accent-success) 6%, transparent) 100%)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 1px 3px rgba(0,0,0,0.2)",
      color: "var(--text-primary)",
      transition: "box-shadow 0.2s ease, transform 0.15s ease, opacity 0.2s ease, filter 0.2s ease",
    };
  }
  const sending = phase === "sending";
  return {
    position: "relative",
    overflow: "hidden",
    border: "1px solid color-mix(in srgb, var(--primary) 35%, transparent)",
    background: sending
      ? "linear-gradient(155deg, color-mix(in srgb, var(--primary) 28%, transparent) 0%, color-mix(in srgb, var(--primary) 10%, transparent) 100%)"
      : "linear-gradient(145deg, color-mix(in srgb, var(--primary) 18%, transparent) 0%, color-mix(in srgb, var(--primary) 6%, transparent) 45%, color-mix(in srgb, var(--primary) 14%, transparent) 100%)",
    boxShadow: sending
      ? "inset 0 1px 0 rgba(255,255,255,0.26), 0 0 0 1px color-mix(in srgb, var(--primary) 30%, transparent), 0 0 14px color-mix(in srgb, var(--primary) 20%, transparent)"
      : "inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 3px rgba(0,0,0,0.25)",
    color: "var(--text-primary)",
    transition: "box-shadow 0.2s ease, transform 0.15s ease, opacity 0.2s ease, filter 0.2s ease",
  };
}

function SoloPlayerCard({ player, canInvite, myCompetitorId, onInvite, invitingUserId, inviteSent, isTO, onEject, ejecting, locked }: {
  player: SoloPlayer;
  canInvite: boolean;
  myCompetitorId: string | null;
  onInvite: (userId: string) => void;
  /** When set, that row is actively sending an invite; all invite buttons disabled while any send is in flight */
  invitingUserId: string | null;
  /** Server: pending invite from you to this free agent */
  inviteSent: boolean;
  isTO: boolean;
  onEject: (userId: string) => void;
  ejecting: boolean;
  locked: boolean;
}) {
  const showActions = !locked && (isTO || (canInvite && !!myCompetitorId));
  const isSending = invitingUserId === player.userId;
  const inviteInFlight = invitingUserId !== null;
  const isSent = inviteSent && !isSending;
  const phase: "idle" | "sending" | "sent" = isSending ? "sending" : isSent ? "sent" : "idle";

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
              type="button"
              className="btn btn-secondary"
              style={{
                fontSize: "10px",
                padding: "4px 10px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                ...soloInviteButtonStyle(phase),
                opacity: inviteInFlight && !isSending ? 0.55 : 1,
                cursor: inviteInFlight && !isSending ? "not-allowed" : isSent ? "default" : "pointer",
                filter: isSending ? "brightness(1.06)" : "none",
              }}
              onClick={() => onInvite(player.userId)}
              disabled={inviteInFlight || isSent}
              aria-busy={isSending}
              aria-label={isSending ? "Sending invite" : isSent ? "Invite sent" : "Invite to team"}
            >
              {isSending ? (
                <span className="material-symbols-outlined" style={{ fontSize: "14px", animation: "spin 0.9s linear infinite" }}>progress_activity</span>
              ) : isSent ? (
                <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "var(--accent-success)" }}>schedule_send</span>
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>person_add</span>
              )}
              {isSending ? "Sending…" : isSent ? "Sent" : "Invite"}
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
   ROSTER ROW (team mode)
   ═══════════════════════════════════════ */

function LobbyRosterRow({
  member,
  competitorId,
  isTO,
  isCaptainView,
  onRemoveFromTeam,
  onEjectFromLobby,
  onKick,
  removeBusy,
  ejectBusy,
  kickBusy,
  locked,
}: {
  member: RosterMember;
  competitorId: string;
  isTO: boolean;
  isCaptainView: boolean;
  onRemoveFromTeam: (competitorId: string, userId: string) => void;
  onEjectFromLobby: (userId: string) => void;
  onKick: (competitorId: string, userId: string) => void;
  removeBusy: boolean;
  ejectBusy: boolean;
  kickBusy: boolean;
  locked: boolean;
}) {
  const showTO = isTO && !locked;
  const showCaptainKick = isCaptainView && member.role !== "captain" && !locked;

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
      {showCaptainKick && (
        <button
          className="btn btn-secondary"
          style={{ padding: "2px 6px", fontSize: "10px" }}
          disabled={kickBusy}
          onClick={() => {
            if (typeof window !== "undefined" && window.confirm(`Kick ${member.username} from the team?`)) {
              onKick(competitorId, member.userId);
            }
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "var(--destructive)" }}>close</span>
        </button>
      )}
      {showTO && (
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
   COMPETITOR CARD (Center pane)
   ═══════════════════════════════════════ */

function CompetitorCard({
  competitor,
  maxTeamSize,
  isMyTeam,
  isTO,
  isCaptainView,
  onForceReady,
  forcing,
  onRemoveFromTeam,
  onEjectFromLobby,
  onKick,
  isRemoveMemberPending,
  isEjectPending,
  isKickPending,
  locked,
}: {
  competitor: Competitor;
  maxTeamSize: number;
  isMyTeam: boolean;
  isTO: boolean;
  isCaptainView: boolean;
  onForceReady: (id: string) => void;
  forcing: boolean;
  onRemoveFromTeam: (competitorId: string, userId: string) => void;
  onEjectFromLobby: (userId: string) => void;
  onKick: (competitorId: string, userId: string) => void;
  isRemoveMemberPending: (competitorId: string, userId: string) => boolean;
  isEjectPending: (userId: string) => boolean;
  isKickPending: (competitorId: string, userId: string) => boolean;
  locked: boolean;
}) {
  const isReady = competitor.status === "ready";
  const isDisqualified = competitor.status === "disqualified";
  const captain = competitor.roster.find(m => m.role === "captain");

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
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{competitor.name}</span>
              {isMyTeam && (
                <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--primary)", letterSpacing: "1px" }}>YOU</span>
              )}
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
              {captain && (
                <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "11px", color: "var(--accent-warning)" }}>stars</span>
                  {captain.username}
                </span>
              )}
              <span>{competitor.roster.length}/{maxTeamSize}</span>
            </div>
          </div>
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
          {isTO && !locked && competitor.status === "incomplete" && (
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
                  <DropdownMenuItem disabled={forcing} onClick={() => onForceReady(competitor.id)}>
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
            isCaptainView={isCaptainView && isMyTeam}
            onRemoveFromTeam={onRemoveFromTeam}
            onEjectFromLobby={onEjectFromLobby}
            onKick={onKick}
            removeBusy={isRemoveMemberPending(competitor.id, member.userId)}
            ejectBusy={isEjectPending(member.userId)}
            kickBusy={isKickPending(competitor.id, member.userId)}
            locked={locked}
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
  locked,
}: {
  competitor: Competitor;
  isTO: boolean;
  onForceReady: (competitorId: string) => void;
  onEject: (userId: string) => void;
  forcing: boolean;
  ejecting: boolean;
  locked: boolean;
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
        {isTO && !locked && targetUserId && (
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
   MY COMMAND CENTER (Right pane)
   ═══════════════════════════════════════ */

function MyCommandCenter({
  myStatus,
  myCompetitor,
  isCaptain,
  pendingInvites,
  locked,
  tournament,
  showCreateTeam,
  setShowCreateTeam,
  joinMutation,
  createCompetitorMutation,
  leaveLobbyMutation,
  leaveCompetitorMutation,
  declineMutation,
  acceptMutation,
  revokeMutation,
  kickMutation,
  transferMutation,
  updateCompetitorMutation,
  sentInvites,
  is1v1,
}: {
  myStatus: MyStatus;
  myCompetitor: Competitor | null;
  isCaptain: boolean;
  pendingInvites: PendingInvite[];
  locked: boolean;
  tournament: LobbyTournament;
  showCreateTeam: boolean;
  setShowCreateTeam: (v: boolean) => void;
  joinMutation: any;
  createCompetitorMutation: any;
  leaveLobbyMutation: any;
  leaveCompetitorMutation: any;
  declineMutation: any;
  acceptMutation: any;
  revokeMutation: any;
  kickMutation: any;
  transferMutation: any;
  updateCompetitorMutation: any;
  sentInvites: PendingInvite[];
  is1v1: boolean;
}) {
  const registrationOpen = tournament.status === "registration";
  const [teamName, setTeamName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);

  if (myStatus === "outside") {
    return (
      <div className="glass-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary)" }}>radar</span>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>My Status</span>
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
          {registrationOpen
            ? is1v1 ? "Register to participate in this tournament." : "Join the lobby to find or create a team."
            : "Registration is closed."}
        </p>
        {registrationOpen && (
          <button
            className="btn btn-primary"
            style={{ width: "100%", padding: "10px", fontSize: "12px" }}
            onClick={() => joinMutation.mutate()}
            disabled={joinMutation.isPending}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>login</span>
            {joinMutation.isPending ? "Joining..." : is1v1 ? "Register" : "Enter Lobby"}
          </button>
        )}
      </div>
    );
  }

  if (myStatus === "spectator") {
    return (
      <div className="glass-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--text-muted)" }}>visibility</span>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Spectating</span>
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Registration has closed. You are watching as a spectator.</p>
      </div>
    );
  }

  if (myStatus === "solo") {
    return (
      <div className="glass-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--accent-info)" }}>explore</span>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Looking for a Team</span>
        </div>

        {pendingInvites.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.5px", marginBottom: "8px" }}>
              INCOMING INVITES ({pendingInvites.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {pendingInvites.map(inv => (
                <div key={inv.inviteId} style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border-color)",
                }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>
                    {inv.competitorName}
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "8px" }}>
                    Invited by {inv.inviterUsername}
                  </div>
                  {!locked && (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1, fontSize: "11px", padding: "6px" }}
                        onClick={() => acceptMutation.mutate(inv.competitorId)}
                        disabled={acceptMutation.isPending}
                      >
                        Accept
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ flex: 1, fontSize: "11px", padding: "6px", color: "var(--destructive)" }}
                        onClick={() => declineMutation.mutate(inv.competitorId)}
                        disabled={declineMutation.isPending}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!locked && !is1v1 && (
          <div style={{ marginBottom: "12px" }}>
            {showCreateTeam ? (
              <CreateTeamInline
                onSubmit={(name) => createCompetitorMutation.mutate(name)}
                submitting={createCompetitorMutation.isPending}
              />
            ) : (
              <button
                className="btn btn-primary"
                style={{ width: "100%", fontSize: "11px", padding: "8px" }}
                onClick={() => setShowCreateTeam(true)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>add</span>
                Create Team
              </button>
            )}
          </div>
        )}

        {!locked && (
          <button
            className="btn btn-secondary"
            style={{ width: "100%", fontSize: "11px", padding: "8px" }}
            onClick={() => leaveLobbyMutation.mutate()}
            disabled={leaveLobbyMutation.isPending}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>logout</span>
            Leave Lobby
          </button>
        )}
      </div>
    );
  }

  // rostered
  if (!myCompetitor) return null;

  return (
    <div className="glass-card" style={{ padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary)" }}>shield</span>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
          {myCompetitor.name}
        </span>
        <span className="dashboard-status-badge" style={{
          background: myCompetitor.status === "ready"
            ? "color-mix(in srgb, var(--accent-success) 15%, transparent)"
            : "color-mix(in srgb, var(--accent-warning) 15%, transparent)",
          color: myCompetitor.status === "ready" ? "var(--accent-success)" : "var(--accent-warning)",
        }}>
          {myCompetitor.status === "ready" ? "Ready" : "Incomplete"}
        </span>
      </div>

      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px" }}>
        {myCompetitor.roster.length} member{myCompetitor.roster.length !== 1 ? "s" : ""}
        {isCaptain && " · You are the captain"}
      </div>

      {/* Captain controls */}
      {isCaptain && !locked && (
        <>
          {/* Rename */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.5px", marginBottom: "6px" }}>
              TEAM NAME
            </div>
            {isEditingName ? (
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  className="dashboard-input"
                  style={{ flex: 1, fontSize: "12px", padding: "6px 10px" }}
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && teamName.trim()) {
                      updateCompetitorMutation.mutate(teamName.trim());
                      setIsEditingName(false);
                    }
                  }}
                />
                <button
                  className="btn btn-primary"
                  style={{ fontSize: "10px", padding: "6px 10px" }}
                  disabled={updateCompetitorMutation.isPending || !teamName.trim()}
                  onClick={() => {
                    if (teamName.trim()) {
                      updateCompetitorMutation.mutate(teamName.trim());
                      setIsEditingName(false);
                    }
                  }}
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                className="btn btn-secondary"
                style={{ width: "100%", fontSize: "11px", padding: "6px", textAlign: "left" }}
                onClick={() => { setTeamName(myCompetitor.name); setIsEditingName(true); }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>edit</span>
                Rename
              </button>
            )}
          </div>

          {/* Sent invites (revokable) */}
          {sentInvites.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.5px", marginBottom: "6px" }}>
                PENDING SENT INVITES
              </div>
              {sentInvites.map(inv => (
                <div key={inv.inviteId} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 8px",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.02)",
                  marginBottom: "4px",
                }}>
                  <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>{inv.inviterUsername}</span>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: "10px", padding: "2px 8px", color: "var(--destructive)" }}
                    onClick={() => revokeMutation.mutate(inv)}
                    disabled={revokeMutation.isPending}
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Transfer captain */}
          {myCompetitor.roster.filter(m => m.role !== "captain").length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.5px", marginBottom: "6px" }}>
                TRANSFER CAPTAIN
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {myCompetitor.roster.filter(m => m.role !== "captain").map(m => (
                  <button
                    key={m.userId}
                    className="btn btn-secondary"
                    style={{ fontSize: "11px", padding: "6px 10px", textAlign: "left" }}
                    onClick={() => {
                      if (typeof window !== "undefined" && window.confirm(`Transfer captain role to ${m.username}?`)) {
                        transferMutation.mutate(m.userId);
                      }
                    }}
                    disabled={transferMutation.isPending}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>stars</span>
                    {m.username}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Leave team */}
      {!locked && (
        <button
          className="btn btn-secondary"
          style={{ width: "100%", fontSize: "11px", padding: "8px", color: "var(--destructive)" }}
          onClick={() => leaveCompetitorMutation.mutate()}
          disabled={leaveCompetitorMutation.isPending}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>logout</span>
          {leaveCompetitorMutation.isPending ? "Leaving..." : "Leave Team"}
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN LOBBY TAB
   ═══════════════════════════════════════ */

export function LobbyTab({ tournament, org }: { tournament: LobbyTournament; org?: Organization }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  const [showCreateTeam, setShowCreateTeam] = useState(false);

  const is1v1 = tournament.maxTeamSize === 1;
  const registrationOpen = tournament.status === "registration";
  const locked = !registrationOpen;
  const queryKey = ["lobby", tournament.id];

  // ── SSE: notification bell (invite, etc.) still triggers refetch as fallback ──
  useEffect(() => {
    return addSseNotificationListener((payload) => {
      if (payload.type === "tournament_invite" && payload.refId === tournament.id) {
        queryClient.invalidateQueries({ queryKey });
      }
    });
  }, [tournament.id, queryClient, queryKey]);

  // ── SSE: dedicated lobby stream — refetch when anyone’s mutation updates this tournament (no 5s polling) ──
  useEffect(() => {
    if (!userId) return;
    const url = `/api/tournaments/${tournament.id}/lobby/stream`;
    const es = new EventSource(url, { withCredentials: true });
    const onLobby = () => {
      queryClient.invalidateQueries({ queryKey });
    };
    es.addEventListener("lobby_changed", onLobby);
    return () => {
      es.removeEventListener("lobby_changed", onLobby);
      es.close();
    };
  }, [userId, tournament.id, queryClient, queryKey]);

  // ── Resolve org role (only when accessed from the org dashboard) ──
  const { data: orgMembers } = useQuery({
    queryKey: ["org-members", org?.id],
    queryFn: async () => {
      if (!org) return [];
      const res = await api.organizations.getOrganizationMembers({ params: { id: org.id } });
      if (res.status === 200) return res.body.data as Array<{ id: string; orgRole: string }>;
      return [];
    },
    staleTime: 60_000,
    enabled: !!org,
  });

  const myOrgRole = useMemo(() => {
    if (!org || !orgMembers || !userId) return null;
    return orgMembers.find(m => m.id === userId)?.orgRole ?? null;
  }, [org, orgMembers, userId]);

  const isStaff = myOrgRole !== null;
  const isTO = myOrgRole === "owner" || myOrgRole === "admin";

  // ── Lobby state: live updates via lobby SSE when logged in; guests get infrequent poll + focus refetch ──
  const { data: lobbyData, isLoading } = useQuery<LobbyState>({
    queryKey,
    queryFn: async () => {
      const res = await api.tournaments.getLobbyState({ params: { id: tournament.id } });
      if (res.status === 200) return res.body as unknown as LobbyState;
      throw new Error("Failed to fetch lobby");
    },
    refetchInterval: userId ? false : 45_000,
    refetchOnWindowFocus: true,
  });

  // ── Derive user status ──
  const derived = useMemo(() => {
    if (!lobbyData || !userId) return { myStatus: "outside" as MyStatus, myCompetitor: null as Competitor | null, isCaptain: false };

    const inSolo = lobbyData.soloPlayers.find(p => p.userId === userId);
    if (inSolo) {
      return { myStatus: inSolo.status as MyStatus, myCompetitor: null as Competitor | null, isCaptain: false };
    }

    for (const comp of lobbyData.competitors) {
      const member = comp.roster.find(m => m.userId === userId);
      if (member) {
        return { myStatus: "rostered" as MyStatus, myCompetitor: comp, isCaptain: member.role === "captain" };
      }
    }

    return { myStatus: "outside" as MyStatus, myCompetitor: null as Competitor | null, isCaptain: false };
  }, [lobbyData, userId]);

  const { myStatus, myCompetitor, isCaptain } = derived;
  const pendingInvites = lobbyData?.pendingInvites ?? [];
  const outgoingInviteTargets = useMemo(
    () => new Set((lobbyData?.outgoingInvites ?? []).map(o => o.targetUserId)),
    [lobbyData?.outgoingInvites],
  );
  const readyCount = lobbyData?.competitors.filter(c => c.status === "ready").length ?? 0;

  // ── Mutations ──
  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await api.tournaments.joinLobby({ params: { id: tournament.id }, body: {} });
      if (res.status !== 201) throw new Error(formatApiErrorBody(res.body, "Failed to join"));
      return res.body;
    },
    onSuccess: (data) => { toast.success(data.state === "COMPETITOR_CREATED" ? "Registered!" : "Joined lobby!"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const createCompetitorMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.tournaments.createCompetitor({ params: { id: tournament.id }, body: { name } });
      if (res.status !== 201) throw new Error(formatApiErrorBody(res.body, "Failed to create team"));
      return res.body;
    },
    onSuccess: () => { toast.success("Team created!"); setShowCreateTeam(false); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const inviteMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!myCompetitor) throw new Error("No team");
      const res = await api.tournaments.inviteToCompetitor({
        params: { id: tournament.id, competitorId: myCompetitor.id },
        body: { targetUserId },
      });
      if (res.status !== 201) throw new Error(formatApiErrorBody(res.body, "Failed to invite"));
    },
    onSuccess: () => { toast.success("Invite sent!"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const inviteSendingUserId =
    inviteMutation.isPending && typeof inviteMutation.variables === "string"
      ? inviteMutation.variables
      : null;

  const leaveLobbyMutation = useMutation({
    mutationFn: async () => {
      const res = await api.tournaments.leaveLobby({ params: { id: tournament.id }, body: {} });
      if (res.status !== 200) throw new Error(formatApiErrorBody(res.body, "Failed to leave"));
    },
    onSuccess: () => { toast.success("Left lobby"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const leaveCompetitorMutation = useMutation({
    mutationFn: async () => {
      if (!myCompetitor) throw new Error("Not on a team");
      const res = await api.tournaments.leaveCompetitor({
        params: { id: tournament.id, competitorId: myCompetitor.id },
        body: {},
      });
      if (res.status !== 200) throw new Error(formatApiErrorBody(res.body, "Failed to leave team"));
    },
    onSuccess: () => { toast.success("Left team"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const forceReadyMutation = useMutation({
    mutationFn: async (competitorId: string) => {
      const res = await api.tournaments.forceReadyCompetitor({ params: { id: tournament.id, competitorId }, body: {} });
      if (res.status !== 200) throw new Error(formatApiErrorBody(res.body, "Failed to force ready"));
    },
    onSuccess: () => { toast.success("Competitor set to ready"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const ejectFromLobbyMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const res = await api.tournaments.ejectFromLobby({ params: { id: tournament.id }, body: { targetUserId } });
      if (res.status !== 200) throw new Error(formatApiErrorBody(res.body, "Failed to remove player"));
    },
    onSuccess: () => { toast.success("Player removed from lobby"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (p: { competitorId: string; targetUserId: string }) => {
      const res = await api.tournaments.removeCompetitorMember({
        params: { id: tournament.id, competitorId: p.competitorId },
        body: { targetUserId: p.targetUserId },
      });
      if (res.status !== 200) throw new Error(formatApiErrorBody(res.body, "Failed to remove from team"));
    },
    onSuccess: () => { toast.success("Removed from team"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const declineMutation = useMutation({
    mutationFn: async (competitorId: string) => {
      const res = await api.tournaments.declineInvite({
        params: { id: tournament.id, competitorId },
        body: {},
      });
      if (res.status !== 200) throw new Error(formatApiErrorBody(res.body, "Failed to decline"));
    },
    onSuccess: () => { toast.success("Invite declined"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const acceptMutation = useMutation({
    mutationFn: async (competitorId: string) => {
      const res = await api.tournaments.joinCompetitor({
        params: { id: tournament.id, competitorId },
        body: {},
      });
      if (res.status !== 200) throw new Error(formatApiErrorBody(res.body, "Failed to accept"));
    },
    onSuccess: () => { toast.success("Joined team!"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeMutation = useMutation({
    mutationFn: async (inv: PendingInvite) => {
      if (!myCompetitor) throw new Error("No team");
      const res = await api.tournaments.revokeInvite({
        params: { id: tournament.id, competitorId: myCompetitor.id, targetUserId: inv.inviteId },
        body: {},
      });
      if (res.status !== 200) throw new Error(formatApiErrorBody(res.body, "Failed to revoke"));
    },
    onSuccess: () => { toast.success("Invite revoked"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const kickMutation = useMutation({
    mutationFn: async (p: { competitorId: string; userId: string }) => {
      const res = await api.tournaments.kickMember({
        params: { id: tournament.id, competitorId: p.competitorId, userId: p.userId },
        body: {},
      });
      if (res.status !== 200) throw new Error(formatApiErrorBody(res.body, "Failed to kick"));
    },
    onSuccess: () => { toast.success("Player kicked"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const transferMutation = useMutation({
    mutationFn: async (newCaptainUserId: string) => {
      if (!myCompetitor) throw new Error("No team");
      const res = await api.tournaments.transferCaptain({
        params: { id: tournament.id, competitorId: myCompetitor.id },
        body: { newCaptainUserId },
      });
      if (res.status !== 200) throw new Error(formatApiErrorBody(res.body, "Failed to transfer"));
    },
    onSuccess: () => { toast.success("Captain transferred"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateCompetitorMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!myCompetitor) throw new Error("No team");
      const res = await api.tournaments.updateCompetitor({
        params: { id: tournament.id, competitorId: myCompetitor.id },
        body: { name },
      });
      if (res.status !== 200) throw new Error(formatApiErrorBody(res.body, "Failed to update team"));
    },
    onSuccess: () => { toast.success("Team updated"); invalidate(); },
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
      {/* Capacity: organizer-only (filling the bracket is not a player concern) */}
      {isTO && (
        <LobbyCapacityBar readyCount={readyCount} max={tournament.lobbyCapacity} registrationOpen={registrationOpen} />
      )}

      {/* Phase Lock Banner */}
      {locked && !isStaff && <PhaseLockBanner />}

      {/* Staff Header */}
      {isStaff && (
        <div className="glass-card" style={{ padding: "16px 20px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--accent-warning)" }}>admin_panel_settings</span>
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
                    ? "Full lobby controls. Use the menus on free agents, teams, and roster rows."
                    : "Viewing as staff. Staff cannot participate in their own tournaments."}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.5px" }}>SOLO</div>
                <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                  {lobbyData?.soloPlayers.length ?? 0}
                </div>
              </div>
              {!is1v1 && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.5px" }}>TEAMS</div>
                  <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                    {lobbyData?.competitors.length ?? 0}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1v1 mode: participant list + command center */}
      {is1v1 ? (
        <div className="lobby-grid-1v1">
          <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--primary)" }}>person</span>
                <span style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "1px", color: "var(--text-secondary)" }}>
                  PARTICIPANTS ({lobbyData?.competitors.length ?? 0})
                </span>
              </div>
            </div>
            {lobbyData?.competitors.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "var(--text-muted)", opacity: 0.2, marginBottom: "12px", display: "block" }}>group_off</span>
                <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No participants yet. Be the first to register!</p>
              </div>
            ) : (
              lobbyData?.competitors.map(comp => (
                <EntrantCard
                  key={comp.id}
                  competitor={comp}
                  isTO={isTO}
                  onForceReady={(id) => forceReadyMutation.mutate(id)}
                  onEject={(uid) => ejectFromLobbyMutation.mutate(uid)}
                  forcing={forceReadyMutation.isPending && forceReadyMutation.variables === comp.id}
                  ejecting={ejectFromLobbyMutation.isPending && ejectFromLobbyMutation.variables === comp.roster[0]?.userId}
                  locked={locked}
                />
              ))
            )}
          </div>
          {!isStaff && (
            <MyCommandCenter
              myStatus={myStatus} myCompetitor={myCompetitor} isCaptain={isCaptain}
              pendingInvites={pendingInvites} locked={locked} tournament={tournament}
              showCreateTeam={showCreateTeam} setShowCreateTeam={setShowCreateTeam}
              joinMutation={joinMutation} createCompetitorMutation={createCompetitorMutation}
              leaveLobbyMutation={leaveLobbyMutation} leaveCompetitorMutation={leaveCompetitorMutation}
              declineMutation={declineMutation} acceptMutation={acceptMutation}
              revokeMutation={revokeMutation} kickMutation={kickMutation}
              transferMutation={transferMutation} updateCompetitorMutation={updateCompetitorMutation}
              sentInvites={[]} is1v1={is1v1}
            />
          )}
        </div>
      ) : (
        /* Team mode: Three-pane layout */
        <div className={isStaff ? "lobby-grid-team-staff" : "lobby-grid-team"}>
          {/* Left pane: Free Agent Pool */}
          <div className="glass-card lobby-free-agents" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent-info)" }}>person_search</span>
                <span style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "1px", color: "var(--text-secondary)" }}>
                  FREE AGENTS ({lobbyData?.soloPlayers.length ?? 0})
                </span>
              </div>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {lobbyData?.soloPlayers.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "var(--text-muted)", opacity: 0.2, marginBottom: "12px", display: "block" }}>group_off</span>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No free agents in the lobby.</p>
                </div>
              ) : (
                lobbyData?.soloPlayers.map(player => (
                  <SoloPlayerCard
                    key={player.userId}
                    player={player}
                    canInvite={isCaptain || isTO}
                    myCompetitorId={myCompetitor?.id ?? null}
                    onInvite={(uid) => inviteMutation.mutate(uid)}
                    invitingUserId={inviteSendingUserId}
                    inviteSent={outgoingInviteTargets.has(player.userId)}
                    isTO={isTO}
                    onEject={(uid) => ejectFromLobbyMutation.mutate(uid)}
                    ejecting={ejectFromLobbyMutation.isPending && ejectFromLobbyMutation.variables === player.userId}
                    locked={locked}
                  />
                ))
              )}
            </div>
          </div>

          {/* Center pane: Competitor Board */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 4px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--primary)" }}>groups</span>
              <span style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "1px", color: "var(--text-secondary)" }}>
                TEAMS ({lobbyData?.competitors.length ?? 0})
              </span>
            </div>
            {lobbyData?.competitors.length === 0 ? (
              <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "var(--text-muted)", opacity: 0.2, marginBottom: "12px", display: "block" }}>shield</span>
                <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No teams formed yet.</p>
              </div>
            ) : (
              lobbyData?.competitors.map(comp => (
                <CompetitorCard
                  key={comp.id}
                  competitor={comp}
                  maxTeamSize={tournament.maxTeamSize}
                  isMyTeam={myCompetitor?.id === comp.id}
                  isTO={isTO}
                  isCaptainView={isCaptain}
                  onForceReady={(id) => forceReadyMutation.mutate(id)}
                  forcing={forceReadyMutation.isPending && forceReadyMutation.variables === comp.id}
                  onRemoveFromTeam={(cid, uid) => removeMemberMutation.mutate({ competitorId: cid, targetUserId: uid })}
                  onEjectFromLobby={(uid) => ejectFromLobbyMutation.mutate(uid)}
                  onKick={(cid, uid) => kickMutation.mutate({ competitorId: cid, userId: uid })}
                  isRemoveMemberPending={(cid, uid) =>
                    removeMemberMutation.isPending
                    && removeMemberMutation.variables?.competitorId === cid
                    && removeMemberMutation.variables?.targetUserId === uid}
                  isEjectPending={(uid) => ejectFromLobbyMutation.isPending && ejectFromLobbyMutation.variables === uid}
                  isKickPending={(cid, uid) =>
                    kickMutation.isPending
                    && kickMutation.variables?.competitorId === cid
                    && kickMutation.variables?.userId === uid}
                  locked={locked}
                />
              ))
            )}
          </div>

          {/* Right pane: My Command Center (players only) */}
          {!isStaff && (
            <MyCommandCenter
              myStatus={myStatus} myCompetitor={myCompetitor} isCaptain={isCaptain}
              pendingInvites={pendingInvites} locked={locked} tournament={tournament}
              showCreateTeam={showCreateTeam} setShowCreateTeam={setShowCreateTeam}
              joinMutation={joinMutation} createCompetitorMutation={createCompetitorMutation}
              leaveLobbyMutation={leaveLobbyMutation} leaveCompetitorMutation={leaveCompetitorMutation}
              declineMutation={declineMutation} acceptMutation={acceptMutation}
              revokeMutation={revokeMutation} kickMutation={kickMutation}
              transferMutation={transferMutation} updateCompetitorMutation={updateCompetitorMutation}
              sentInvites={[]} is1v1={is1v1}
            />
          )}
        </div>
      )}
    </div>
  );
}
