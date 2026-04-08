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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function transitionTitle(from: string, to: string): string {
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
        body: { status: to as any },
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

  const showRevertToDraft =
    from === "registration";

  const setupStatuses = TOURNAMENT_PHASES.SETUP as readonly string[];
  const liveStatuses = TOURNAMENT_PHASES.LIVE as readonly string[];
  const phaseHint = setupStatuses.includes(from)
    ? "Registration phase — You can still adjust the rules and settings."
    : liveStatuses.includes(from)
      ? "Live Competition — Rules and brackets are now locked to ensure fairness."
      : "Event Concluded — This tournament has finished.";

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
            padding: "20px",
            marginBottom: "20px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {setupStatuses.includes(from) && (
            <Alert variant="info" className="mb-4">
              <span className="dashboard-alert-icon">
                <span className="material-symbols-outlined text-[var(--primary)]">tips_and_updates</span>
              </span>
              <div className="dashboard-alert-body">
                <AlertTitle>Setup</AlertTitle>
                <AlertDescription>
                  You can still change most tournament rules. Use the actions below instead of picking a status
                  manually — each step is validated on the server.
                </AlertDescription>
              </div>
            </Alert>
          )}
          <h4
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: "0 0 6px",
            }}
          >
            Tournament phase
          </h4>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 16px" }}>
            {phaseHint} Use the buttons below to progress through each stage of your event.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
            <span
              className="dashboard-status-badge"
              style={{
                background: "color-mix(in srgb, var(--primary) 18%, transparent)",
                color: "var(--primary)",
                textTransform: "uppercase",
                fontSize: "11px",
                letterSpacing: "0.04em",
                padding: "6px 12px",
              }}
            >
              {from.replace(/_/g, " ")}
            </span>
          </div>

          {from === "cancelled" ? (
            <div style={{ marginTop: "16px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent-success)" }}>
                Recovery
              </span>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "8px 0" }}>
                Reopening is allowed only if this tournament has no matches yet.
              </p>
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
            </div>
          ) : (
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)" }}>
                Next steps
              </span>
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
            </div>
          )}
        </div>
      )}

      {variant === "overview" && from !== "draft" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "flex-end" }}>
          {forward.map((to) => (
            <button
              key={to}
              type="button"
              className="btn btn-primary"
              style={{ padding: "10px 20px", fontSize: "12px" }}
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
              style={{ padding: "10px 20px", fontSize: "12px" }}
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
