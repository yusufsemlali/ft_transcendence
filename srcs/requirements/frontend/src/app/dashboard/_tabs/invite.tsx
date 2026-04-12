"use client";

import { useState, useEffect, useCallback } from "react";
import type { Organization } from "@ft-transcendence/contracts";
import { ORG_ROLES } from "@ft-transcendence/contracts";
import type { OrgRole } from "@ft-transcendence/contracts";
import api from "@/lib/api/api";
import { formatApiErrorBody } from "@/lib/api-error";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";

const ROLE_META: Record<string, { label: string; color: string; icon: string }> = {
  owner:   { label: "Owner",   color: "var(--accent-warning, #f59e0b)", icon: "crown" },
  admin:   { label: "Admin",   color: "var(--primary)",                  icon: "shield_person" },
  referee: { label: "Referee", color: "var(--accent-info, #3b82f6)",     icon: "gavel" },
  member:  { label: "Member",  color: "var(--text-muted)",               icon: "person" },
};

interface InviteEntry {
  id: string;
  username: string;
  orgRole: OrgRole;
  status: "pending" | "active" | "declined";
  joinedAt: string | Date;
}

export function InviteTab({ org }: { org: Organization }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("member");
  const [submitting, setSubmitting] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<InviteEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.organizations.getOrganizationMembers({ params: { id: org.id } });
      if (res.status === 200) {
        // Filter for pending only
        const all = res.body.data as InviteEntry[];
        setPendingInvites(all.filter(m => m.status === 'pending'));
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [org.id]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleInvite = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const res = await api.organizations.addMember({
        params: { id: org.id },
        body: { email: trimmed, role: role as OrgRole },
      });
      if (res.status === 201) {
        toast.success("Invitation sent!");
        setEmail("");
        fetchPending();
      } else {
        toast.error(formatApiErrorBody(res.body, "Failed to send invitation"));
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelInvite = async (userId: string) => {
    if (!confirm("Cancel this invitation?")) return;
    try {
      const res = await api.organizations.removeMember({ params: { id: org.id, userId }, body: {} });
      if (res.status === 200) {
        toast.success("Invitation cancelled");
        fetchPending();
      }
    } catch { toast.error("Failed to cancel"); }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", margin: "0 0 4px" }}>Invite Players</h2>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Onboard new members to your organization.</p>
      </div>

      {/* Invite form */}
      <div className="glass-card" style={{ padding: "24px", marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <label className="dashboard-field" style={{ flex: 1, minWidth: "240px" }}>
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

          <label className="dashboard-field" style={{ width: "160px" }}>
            <span className="dashboard-field-label">Assigned Role</span>
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
            style={{ fontSize: "12px", padding: "10px 24px", height: "40px" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>send</span>
            {submitting ? "Sending..." : "Send Invite"}
          </button>
        </div>
      </div>

      {/* Pending Invites List */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
           <h3 style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "1px", textTransform: "uppercase" }}>PENDING INVITATIONS</h3>
           <div style={{ flex: 1, height: "1px", background: "var(--border-color)", opacity: 0.5 }}></div>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <span className="material-symbols-outlined spin" style={{ color: "var(--primary)" }}>progress_activity</span>
          </div>
        ) : pendingInvites.length === 0 ? (
          <div className="glass-card" style={{ padding: "40px", textAlign: "center", borderStyle: "dashed", opacity: 0.6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "var(--text-muted)", marginBottom: "12px" }}>mail</span>
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No pending invitations found.</p>
          </div>
        ) : (
          <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
            {pendingInvites.map((entry: InviteEntry) => (
              <div key={entry.id} style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "14px 20px", borderBottom: "1px solid var(--border-color)",
              }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                   <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--text-muted)" }}>person</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>@{entry.username}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Sent {new Date(entry.joinedAt).toLocaleDateString()}</div>
                </div>
                <span style={{
                  fontSize: "9px", fontWeight: "700", textTransform: "uppercase",
                  padding: "2px 8px", borderRadius: "4px",
                  background: `color-mix(in srgb, ${ROLE_META[entry.orgRole]?.color || "var(--text-muted)"} 12%, transparent)`,
                  color: ROLE_META[entry.orgRole]?.color || "var(--text-muted)",
                }}>
                  {ROLE_META[entry.orgRole]?.label || entry.orgRole}
                </span>
                <button 
                  onClick={() => handleCancelInvite(entry.id)}
                  className="btn btn-secondary" 
                  style={{ padding: "6px", minWidth: "32px", color: "var(--destructive)" }}
                  title="Cancel invite"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
