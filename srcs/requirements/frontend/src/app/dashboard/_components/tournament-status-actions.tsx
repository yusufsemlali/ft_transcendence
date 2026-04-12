"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "@tanstack/react-query";
import type { Organization, Tournament } from "@ft-transcendence/contracts";
import {
  getOutgoingStatusTransitions,
  TOURNAMENT_TRANSITION_DESCRIPTIONS,
  getTransitionDescriptionKey,
  TOURNAMENT_PHASES,
} from "@ft-transcendence/contracts";
import api from "@/lib/api/api";
import { toast } from "@/components/ui/sonner";
import { formatApiErrorBody } from "@/lib/api-error";

function transitionTitle(_from: string, to: string): string {
  const labels: Record<string, string> = {
    registration: "Open registration",
    upcoming: "Move to upcoming",
    ongoing: "Start live phase",
    completed: "Mark completed",
    cancelled: "Cancel tournament",
    draft: "Return to draft",
  };
  return labels[to] ?? `Change to ${to}`;
}

function phaseIcon(status: string) {
  const map: Record<string, string> = {
    draft: "edit_note",
    registration: "how_to_reg",
    upcoming: "event_upcoming",
    ongoing: "sports_esports",
    completed: "emoji_events",
    cancelled: "cancel",
  };
  return map[status] ?? "info";
}

function phaseAccent(status: string): string {
  const setupStatuses: readonly string[] = TOURNAMENT_PHASES.SETUP;
  const liveStatuses: readonly string[] = TOURNAMENT_PHASES.LIVE;
  const endedStatuses: readonly string[] = TOURNAMENT_PHASES.ENDED;

  if (setupStatuses.includes(status)) return "var(--primary)";
  if (liveStatuses.includes(status)) return "var(--accent-warning)";
  if (status === "completed") return "var(--accent-success)";
  if (endedStatuses.includes(status)) return "var(--destructive)";
  return "var(--text-muted)";
}

type Variant = "settings" | "overview";

export function TournamentStatusActions({
  tournament,
  org,
  onUpdate,
  variant,
}: {
  tournament: Tournament;
  org: Organization;
  onUpdate: (t: Tournament) => void;
  variant: Variant;
}) {
  const [confirm, setConfirm] = useState<
    | { to: string; requireTypedCancel?: boolean }
    | null
  >(null);
  const [typedCancel, setTypedCancel] = useState("");

  const statusMutation = useMutation({
    mutationFn: async (to: string) => {
      const res = await api.tournaments.updateTournament({
        params: { organizationId: org.id, id: tournament.id },
        body: { status: to as Tournament["status"] },
      });
      if (res.status !== 200) {
        throw new Error(formatApiErrorBody(res.body, "Status update failed"));
      }
      return (res.body as { data: Tournament }).data;
    },
    onSuccess: (data) => {
      toast.success("Tournament status updated");
      setConfirm(null);
      setTypedCancel("");
      onUpdate(data);
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  const from = tournament.status;
  const outgoing = [...getOutgoingStatusTransitions(from)];
  const forward = outgoing.filter((t) => t !== "cancelled");

  const descriptionFor = (to: string) =>
    TOURNAMENT_TRANSITION_DESCRIPTIONS[getTransitionDescriptionKey(from, to)] ??
    `This will set status to "${to}".`;

  const runTransition = (to: string) => {
    if (confirm?.requireTypedCancel && typedCancel.trim().toUpperCase() !== "CANCEL") {
      toast.error('Type CANCEL to confirm.');
      return;
    }
    statusMutation.mutate(to);
  };

  const showRevertToDraft = from === "registration";

  const setupStatuses = TOURNAMENT_PHASES.SETUP as readonly string[];
  const liveStatuses = TOURNAMENT_PHASES.LIVE as readonly string[];
  const endedStatuses = TOURNAMENT_PHASES.ENDED as readonly string[];

  const accent = phaseAccent(from);
  const isSetup = setupStatuses.includes(from);
  const isLive = liveStatuses.includes(from);
  const isEnded = endedStatuses.includes(from);
  const isCancelled = from === "cancelled";

  const hint = isSetup
    ? "You can still change most tournament rules. Use the actions below to progress — each step is validated on the server."
    : isLive
      ? "Rules and brackets are locked to ensure fairness. Advance the tournament when play is complete."
      : isCancelled
        ? "This tournament was cancelled. You can reopen it if no matches have been played."
        : "This tournament has concluded. Settings are frozen.";

  const buttonStyle =
    variant === "overview"
      ? { padding: "10px 20px", fontSize: "12px" }
      : { padding: "8px 16px", fontSize: "12px" };

  if (variant === "overview" && from === "draft") {
    return null;
  }

  return (
    <>
      {variant === "settings" && (
        <div
          className="glass-card"
          style={{
            marginBottom: "20px",
            padding: 0,
            overflow: "hidden",
            borderColor: `color-mix(in srgb, ${accent} 25%, var(--border-color))`,
          }}
        >
          {/* ── Header row: icon + title + badge ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-md)",
              padding: "var(--spacing-5)",
              background: `color-mix(in srgb, ${accent} 6%, transparent)`,
              borderBottom: `1px solid color-mix(in srgb, ${accent} 12%, var(--border-color))`,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "22px", color: accent, flexShrink: 0 }}
            >
              {phaseIcon(from)}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                  Tournament phase
                </span>
                <span
                  className="dashboard-status-badge"
                  style={{
                    background: `color-mix(in srgb, ${accent} 18%, transparent)`,
                    color: accent,
                    textTransform: "uppercase",
                    fontSize: "10px",
                    letterSpacing: "0.06em",
                    padding: "3px 10px",
                  }}
                >
                  {from.replace(/_/g, " ")}
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0", lineHeight: 1.5 }}>
                {hint}
              </p>
            </div>
          </div>

          {/* ── Action body ── */}
          <div style={{ padding: "var(--spacing-5)" }}>
            {isCancelled ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent-success)" }}>
                    undo
                  </span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent-success)" }}>
                    Recovery options
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {forward.map((to) => (
                    <button
                      key={to}
                      type="button"
                      className="btn btn-primary"
                      style={buttonStyle}
                      disabled={statusMutation.isPending}
                      onClick={() => setConfirm({ to })}
                    >
                      {to === "draft" ? "Reopen as draft" : "Reopen registration"}
                    </button>
                  ))}
                </div>
              </>
            ) : isEnded ? (
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                No further transitions available.
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                {forward.map((to) => (
                  <button
                    key={to}
                    type="button"
                    className="btn btn-primary"
                    style={buttonStyle}
                    disabled={statusMutation.isPending}
                    onClick={() => setConfirm({ to })}
                  >
                    {transitionTitle(from, to)}
                  </button>
                ))}
                {showRevertToDraft && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={buttonStyle}
                    disabled={statusMutation.isPending}
                    onClick={() => setConfirm({ to: "draft" })}
                  >
                    Revert to draft
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {variant === "overview" && from !== "draft" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "flex-end" }}>
          {forward.map((to) => (
            <button
              key={to}
              type="button"
              className="btn btn-primary"
              style={{ padding: "6px 14px", fontSize: "11px" }}
              disabled={statusMutation.isPending}
              onClick={() => setConfirm({ to })}
            >
              {transitionTitle(from, to)}
            </button>
          ))}
          {showRevertToDraft && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: "6px 14px", fontSize: "11px" }}
              disabled={statusMutation.isPending}
              onClick={() => setConfirm({ to: "draft" })}
            >
              Revert to draft
            </button>
          )}
        </div>
      )}

      {confirm &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              minHeight: "100dvh",
              margin: 0,
              zIndex: 10050,
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              boxSizing: "border-box",
            }}
            onClick={() => !statusMutation.isPending && setConfirm(null)}
          >
            <div
              className="glass-card"
              style={{
                maxWidth: "440px",
                width: "100%",
                padding: "24px",
                border: "1px solid var(--border-color)",
                margin: "auto",
                flexShrink: 0,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 600 }}>
                Confirm: {transitionTitle(from, confirm.to)}
              </h3>
              <p
                style={{
                  margin: "0 0 16px",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                {descriptionFor(confirm.to)}
              </p>
              {confirm.requireTypedCancel && (
                <label className="dashboard-field" style={{ marginBottom: "16px" }}>
                  <span className="dashboard-field-label">Type CANCEL to confirm</span>
                  <input
                    className="dashboard-input"
                    value={typedCancel}
                    onChange={(e) => setTypedCancel(e.target.value)}
                    placeholder="CANCEL"
                    autoComplete="off"
                  />
                </label>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={statusMutation.isPending}
                  onClick={() => {
                    setConfirm(null);
                    setTypedCancel("");
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className={confirm.to === "cancelled" ? "btn btn-secondary" : "btn btn-primary"}
                  style={
                    confirm.to === "cancelled"
                      ? {
                          color: "var(--destructive)",
                          borderColor: "color-mix(in srgb, var(--destructive) 40%, transparent)",
                        }
                      : undefined
                  }
                  disabled={statusMutation.isPending}
                  onClick={() => runTransition(confirm.to)}
                >
                  {statusMutation.isPending ? "Applying…" : "Confirm"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

/** Cancel tournament (typed confirm + portal). Lives in Settings → Danger zone only. */
export function TournamentCancelDangerZone({
  tournament,
  org,
  onUpdate,
}: {
  tournament: Tournament;
  org: Organization;
  onUpdate: (t: Tournament) => void;
}) {
  const from = tournament.status;
  const canCancel =
    from !== "cancelled" &&
    getOutgoingStatusTransitions(from).includes("cancelled");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typedCancel, setTypedCancel] = useState("");

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await api.tournaments.updateTournament({
        params: { organizationId: org.id, id: tournament.id },
        body: { status: "cancelled" as const },
      });
      if (res.status !== 200) {
        throw new Error(formatApiErrorBody(res.body, "Failed to cancel tournament"));
      }
      return (res.body as { data: Tournament }).data;
    },
    onSuccess: (data) => {
      toast.success("Tournament cancelled");
      setConfirmOpen(false);
      setTypedCancel("");
      onUpdate(data);
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  const description =
    TOURNAMENT_TRANSITION_DESCRIPTIONS[getTransitionDescriptionKey(from, "cancelled")] ??
    "This will cancel the tournament.";

  const runCancel = () => {
    if (typedCancel.trim().toUpperCase() !== "CANCEL") {
      toast.error("Type CANCEL to confirm.");
      return;
    }
    cancelMutation.mutate();
  };

  if (!canCancel) return null;

  return (
    <>
      <div
        style={{
          marginBottom: "20px",
          paddingBottom: "20px",
          borderBottom: "1px solid rgba(var(--destructive-rgb), 0.15)",
        }}
      >
        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--destructive)" }}>
          Cancel tournament
        </span>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "8px 0 12px" }}>
          Cancelling is serious. You may reopen later only if no matches have been created.
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          style={{
            color: "var(--destructive)",
            borderColor: "color-mix(in srgb, var(--destructive) 35%, transparent)",
            fontSize: "12px",
            padding: "8px 16px",
          }}
          disabled={cancelMutation.isPending}
          onClick={() => setConfirmOpen(true)}
        >
          Cancel tournament…
        </button>
      </div>

      {confirmOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              minHeight: "100dvh",
              margin: 0,
              zIndex: 10050,
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              boxSizing: "border-box",
            }}
            onClick={() => !cancelMutation.isPending && setConfirmOpen(false)}
          >
            <div
              className="glass-card"
              style={{
                maxWidth: "440px",
                width: "100%",
                padding: "24px",
                border: "1px solid var(--border-color)",
                margin: "auto",
                flexShrink: 0,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 600 }}>
                Confirm: Cancel tournament
              </h3>
              <p
                style={{
                  margin: "0 0 16px",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                {description}
              </p>
              <label className="dashboard-field" style={{ marginBottom: "16px" }}>
                <span className="dashboard-field-label">Type CANCEL to confirm</span>
                <input
                  className="dashboard-input"
                  value={typedCancel}
                  onChange={(e) => setTypedCancel(e.target.value)}
                  placeholder="CANCEL"
                  autoComplete="off"
                />
              </label>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={cancelMutation.isPending}
                  onClick={() => {
                    setConfirmOpen(false);
                    setTypedCancel("");
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    color: "var(--destructive)",
                    borderColor: "color-mix(in srgb, var(--destructive) 40%, transparent)",
                  }}
                  disabled={cancelMutation.isPending}
                  onClick={runCancel}
                >
                  {cancelMutation.isPending ? "Applying…" : "Confirm"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

/** Permanent deletion (typed confirm). Only in Settings → Danger zone. */
export function TournamentDeleteDangerZone({
  tournament,
  org,
  onDelete,
}: {
  tournament: Tournament;
  org: Organization;
  onDelete: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typedDelete, setTypedDelete] = useState("");

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.tournaments.deleteTournament({
        params: { organizationId: org.id, id: tournament.id },
      });
      if (res.status !== 200) {
        throw new Error(formatApiErrorBody(res.body, "Failed to delete tournament"));
      }
      return res.body;
    },
    onSuccess: () => {
      toast.success("Tournament deleted permanently");
      setConfirmOpen(false);
      onDelete();
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  const runDelete = () => {
    if (typedDelete.trim().toUpperCase() !== "DELETE") {
      toast.error("Type DELETE to confirm.");
      return;
    }
    deleteMutation.mutate();
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        style={{
          color: "var(--destructive)",
          borderColor: "color-mix(in srgb, var(--destructive) 25%, transparent)",
          fontSize: "12px",
          padding: "8px 16px",
        }}
        disabled={deleteMutation.isPending}
        onClick={() => setConfirmOpen(true)}
      >
        Delete tournament
      </button>

      {confirmOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              minHeight: "100dvh",
              margin: 0,
              zIndex: 10050,
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              boxSizing: "border-box",
            }}
            onClick={() => !deleteMutation.isPending && setConfirmOpen(false)}
          >
            <div
              className="glass-card"
              style={{
                maxWidth: "440px",
                width: "100%",
                padding: "24px",
                border: "1px solid var(--border-color)",
                margin: "auto",
                flexShrink: 0,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 600 }}>
                Confirm: Delete tournament
              </h3>
              <p
                style={{
                  margin: "0 0 16px",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                This action is irreversible. It will permanently remove <strong>{tournament.name}</strong> and all its matches, results, and settings.
              </p>
              <label className="dashboard-field" style={{ marginBottom: "16px" }}>
                <span className="dashboard-field-label">Type DELETE to confirm</span>
                <input
                  className="dashboard-input"
                  value={typedDelete}
                  onChange={(e) => setTypedDelete(e.target.value)}
                  placeholder="DELETE"
                  autoComplete="off"
                />
              </label>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    setConfirmOpen(false);
                    setTypedDelete("");
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    color: "var(--destructive)",
                    borderColor: "color-mix(in srgb, var(--destructive) 40%, transparent)",
                  }}
                  disabled={deleteMutation.isPending}
                  onClick={runDelete}
                >
                  {deleteMutation.isPending ? "Deleting…" : "Permanently Delete"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
