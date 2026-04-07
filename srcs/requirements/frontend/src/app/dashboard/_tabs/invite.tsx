"use client";

import { useState } from "react";
import type { Organization } from "@ft-transcendence/contracts";
import { ORG_ROLES } from "@ft-transcendence/contracts";
import type { OrgRole } from "@ft-transcendence/contracts";
import api from "@/lib/api/api";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const ROLE_META: Record<string, { label: string; color: string; icon: string }> = {
  owner:   { label: "Owner",   color: "var(--accent-warning, #f59e0b)", icon: "crown" },
  admin:   { label: "Admin",   color: "var(--primary)",                  icon: "shield_person" },
  referee: { label: "Referee", color: "var(--accent-info, #3b82f6)",     icon: "gavel" },
  member:  { label: "Member",  color: "var(--text-muted)",               icon: "person" },
};

interface InviteEntry {
  id: string;
  email: string;
  role: OrgRole;
  status: "pending" | "sent" | "error";
  error?: string;
  timestamp: Date;
}

export function InviteTab({ org }: { org: Organization }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("member");
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<InviteEntry[]>([]);

  const handleInvite = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;

    const id = crypto.randomUUID();
    const entry: InviteEntry = { id, email: trimmed, role: role as OrgRole, status: "pending", timestamp: new Date() };
    setHistory(prev => [entry, ...prev]);
    setSubmitting(true);

    try {
      const res = await api.organizations.addMember({
        params: { id: org.id },
        body: { email: trimmed, role: role as OrgRole },
      });
      if (res.status === 201) {
        setHistory(prev => prev.map(e => e.id === id ? { ...e, status: "sent" as const } : e));
        setEmail("");
      } else {
        setHistory(prev => prev.map(e => e.id === id ? { ...e, status: "error" as const, error: (res.body as any)?.message || "Failed" } : e));
      }
    } catch {
      setHistory(prev => prev.map(e => e.id === id ? { ...e, status: "error" as const, error: "Network error" } : e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", margin: "0 0 4px" }}>Invite Players</h2>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Add players to your organization by email address.</p>
      </div>

      {/* Invite form */}
      <div className="glass-card" style={{ padding: "24px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--primary)" }}>mail</span>
          <span style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "1px", color: "var(--text-secondary)" }}>SEND INVITATION</span>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <label className="dashboard-field" style={{ flex: 2, minWidth: "200px" }}>
            <span className="dashboard-field-label">Email Address</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="player@example.com"
              className="dashboard-input"
              onKeyDown={e => e.key === "Enter" && !submitting && handleInvite()}
            />
          </label>

          <label className="dashboard-field" style={{ width: "150px" }}>
            <span className="dashboard-field-label">Role</span>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORG_ROLES.filter(r => r !== "owner").map(r => (
                  <SelectItem key={r} value={r}>{ROLE_META[r]?.label || r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <button
            className="btn btn-primary"
            onClick={handleInvite}
            disabled={submitting || !email.trim()}
            style={{ fontSize: "12px", padding: "8px 20px", whiteSpace: "nowrap" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>send</span>
            {submitting ? "Sending..." : "Send Invite"}
          </button>
        </div>

        {/* Bulk hint */}
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "12px", opacity: 0.6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: "12px", verticalAlign: "-2px", marginRight: "4px" }}>info</span>
          The user must already have an account on the platform.
        </p>
      </div>

      {/* Invite history */}
      {history.length > 0 && (
        <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent-secondary, #a855f7)" }}>history</span>
              <span style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "1px", color: "var(--text-secondary)" }}>INVITE HISTORY</span>
            </div>
          </div>

          {history.map(entry => (
            <div key={entry.id} style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "12px 16px", borderBottom: "1px solid var(--border-color)",
            }}>
              {/* Status icon */}
              <span className="material-symbols-outlined" style={{
                fontSize: "18px",
                color: entry.status === "sent" ? "var(--accent-success, #22c55e)"
                  : entry.status === "error" ? "var(--destructive)"
                  : "var(--text-muted)",
                animation: entry.status === "pending" ? "spin 1s linear infinite" : undefined,
              }}>
                {entry.status === "sent" ? "check_circle" : entry.status === "error" ? "error" : "progress_activity"}
              </span>

              {/* Email */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{entry.email}</div>
                {entry.error && <div style={{ fontSize: "11px", color: "var(--destructive)", marginTop: "2px" }}>{entry.error}</div>}
              </div>

              {/* Role badge */}
              <span style={{
                fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px",
                padding: "3px 8px", borderRadius: "4px",
                background: `color-mix(in srgb, ${ROLE_META[entry.role]?.color || "var(--text-muted)"} 12%, transparent)`,
                color: ROLE_META[entry.role]?.color || "var(--text-muted)",
              }}>
                {ROLE_META[entry.role]?.label || entry.role}
              </span>

              {/* Time */}
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
                {entry.timestamp.toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
