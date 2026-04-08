"use client";

import { useState, useEffect } from "react";
import type { Organization } from "@ft-transcendence/contracts";
import { ORG_ROLES } from "@ft-transcendence/contracts";
import type { OrgRole } from "@ft-transcendence/contracts";
import api from "@/lib/api/api";
import { EmptyPanel } from "../_components/empty-panel";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { toastApiError } from "@/lib/api-error";

/* ── Types ── */
interface Member {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  xp: number;
  level: number;
  isOnline: boolean;
  orgRole: OrgRole;
  joinedAt: string | Date;
}

/* ── Role styling ── */
const ROLE_META: Record<string, { label: string; color: string; icon: string }> = {
  owner:   { label: "Owner",   color: "var(--accent-warning, #f59e0b)", icon: "crown" },
  admin:   { label: "Admin",   color: "var(--primary)",                 icon: "shield_person" },
  referee: { label: "Referee", color: "var(--accent-info, #3b82f6)",    icon: "gavel" },
  member:  { label: "Member",  color: "var(--text-muted)",              icon: "person" },
};

/* ── Member Row ── */
function MemberRow({ member, currentUserId, isAdmin, onRoleChange, onRemove }: {
  member: Member;
  currentUserId: string | null;
  isAdmin: boolean;
  onRoleChange: (userId: string, role: OrgRole) => void;
  onRemove: (userId: string, name: string) => void;
}) {
  const role = ROLE_META[member.orgRole] || ROLE_META.member;
  const isSelf = currentUserId === member.id;
  const isOwner = member.orgRole === "owner";
  const canManage = isAdmin && !isOwner && !isSelf;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 16px",
      borderBottom: "1px solid var(--border-color)",
      transition: "background 0.15s",
    }}>
      {/* Avatar */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          overflow: "hidden",
          backgroundColor: "var(--bg-secondary)",
        }}>
          {member.avatar ? (
            <img
              src={member.avatar}
              alt={member.username}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--text-muted)" }}>person</span>
            </div>
          )}
        </div>
        {/* Online indicator */}
        {member.isOnline && (
          <div style={{
            position: "absolute",
            bottom: "0",
            right: "0",
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: "#22c55e",
            border: "2px solid oklch(0.15 0 0)",
            boxShadow: "0 0 6px #22c55e80",
          }} />
        )}
      </div>

      {/* Name & info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            {member.displayName || member.username}
          </span>
          {isSelf && (
            <span style={{ fontSize: "9px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.5px" }}>(YOU)</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
          <span>@{member.username}</span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>Lvl {member.level}</span>
          <span style={{ opacity: 0.3 }}>·</span>
          <span>{new Date(member.joinedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Role badge / selector */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {canManage ? (
          <div style={{ width: "130px" }}>
            <Select
              value={member.orgRole}
              onValueChange={(val: string) => onRoleChange(member.id, val as OrgRole)}
            >
              <SelectTrigger style={{ padding: "4px 8px", minHeight: "30px", fontSize: "11px" }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORG_ROLES.filter(r => r !== "owner").map(r => (
                  <SelectItem key={r} value={r}>{ROLE_META[r]?.label || r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <span
            className="dashboard-status-badge"
            style={{
              background: `color-mix(in srgb, ${role.color} 15%, transparent)`,
              color: role.color,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "12px", marginRight: "4px" }}>{role.icon}</span>
            {role.label}
          </span>
        )}

        {/* Remove button */}
        {canManage && (
          <button
            onClick={() => onRemove(member.id, member.displayName || member.username)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "4px",
              color: "var(--text-muted)",
              transition: "color 0.15s, background 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--destructive)"; e.currentTarget.style.background = "color-mix(in srgb, var(--destructive) 10%, transparent)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "none"; }}
            title="Remove member"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>person_remove</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Add Member Form ── */
function AddMemberForm({ org, onAdded, onCancel }: {
  org: Organization;
  onAdded: () => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("member");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.organizations.addMember({
        params: { id: org.id },
        body: { email: email.trim(), role: role as OrgRole },
      });
      if (res.status === 201) {
        toast.success("Invitation sent");
        onAdded();
      } else {
        toastApiError(res.body, "Failed to add member");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Add Member</h3>
        <button onClick={onCancel} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
        </button>
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
        <label className="dashboard-field" style={{ flex: 1, minWidth: "200px" }}>
          <span className="dashboard-field-label">Email Address</span>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="dashboard-input"
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
          />
        </label>

        <label className="dashboard-field" style={{ width: "140px" }}>
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

        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-secondary" onClick={onCancel} style={{ fontSize: "11px", padding: "8px 16px" }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ fontSize: "11px", padding: "8px 16px" }}>
            {submitting ? "Adding..." : "Add Member"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Tab ── */
export function MembersTab({ org }: { org: Organization }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const [mRes, uRes] = await Promise.all([
        api.organizations.getOrganizationMembers({ params: { id: org.id } }),
        api.users.getMe(),
      ]);
      if (mRes.status === 200) setMembers(mRes.body.data as Member[]);
      if (uRes.status === 200) setCurrentUserId(uRes.body.id);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, [org.id]);

  // Determine if current user has admin+ privileges
  const currentMember = members.find(m => m.id === currentUserId);
  const isAdmin = currentMember?.orgRole === "owner" || currentMember?.orgRole === "admin";

  const handleRoleChange = async (userId: string, role: OrgRole) => {
    try {
      const res = await api.organizations.updateMemberRole({
        params: { id: org.id, userId },
        body: { role },
      });
      if (res.status === 200) {
        setMembers(prev => prev.map(m => m.id === userId ? { ...m, orgRole: role } : m));
      }
    } catch { /* silent */ }
  };

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from this organization?`)) return;
    try {
      const res = await api.organizations.removeMember({
        params: { id: org.id, userId },
        body: {},
      });
      if (res.status === 200) {
        setMembers(prev => prev.filter(m => m.id !== userId));
      }
    } catch { /* silent */ }
  };

  // Filter & sort
  const filtered = members
    .filter(m => {
      if (!search) return true;
      const q = search.toLowerCase();
      return m.username.toLowerCase().includes(q) ||
        (m.displayName?.toLowerCase().includes(q) ?? false);
    })
    .sort((a, b) => {
      // Sort by role weight: owner > admin > referee > member
      const weights: Record<string, number> = { owner: 0, admin: 1, referee: 2, member: 3 };
      return (weights[a.orgRole] ?? 4) - (weights[b.orgRole] ?? 4);
    });

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0" }}>
        <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "var(--primary)", animation: "spin 1s linear infinite" }}>progress_activity</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>Members</h2>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
            {members.length} member{members.length !== 1 ? "s" : ""}
            {members.filter(m => m.isOnline).length > 0 && (
              <span> · <span style={{ color: "#22c55e" }}>{members.filter(m => m.isOnline).length} online</span></span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <span className="material-symbols-outlined" style={{
              position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)",
              fontSize: "16px", color: "var(--text-muted)", pointerEvents: "none",
            }}>search</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search members..."
              className="dashboard-input"
              style={{ paddingLeft: "32px", width: "200px", fontSize: "12px" }}
            />
          </div>
          {isAdmin && !showAdd && (
            <button className="btn btn-primary" style={{ fontSize: "11px", padding: "8px 16px" }} onClick={() => setShowAdd(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>person_add</span>
              Add Member
            </button>
          )}
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ marginBottom: "20px" }}>
          <AddMemberForm
            org={org}
            onAdded={() => { setShowAdd(false); fetchMembers(); }}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {/* Member list */}
      {members.length === 0 && !showAdd ? (
        <EmptyPanel
          icon="group"
          title="No Members Yet"
          subtitle="Add members to your organization to start collaborating."
          actionLabel="+ Add Member"
          onAction={() => setShowAdd(true)}
        />
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
              No members match &ldquo;{search}&rdquo;
            </div>
          ) : (
            filtered.map(m => (
              <MemberRow
                key={m.id}
                member={m}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
                onRoleChange={handleRoleChange}
                onRemove={handleRemove}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
