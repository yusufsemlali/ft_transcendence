"use client";

import { useState, useEffect } from "react";
import type { Organization } from "@ft-transcendence/contracts";
import type { OrgRole } from "@ft-transcendence/contracts";
import api from "@/lib/api/api";

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

export function RefereesTab({ org }: { org: Organization }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await api.organizations.getOrganizationMembers({ params: { id: org.id } });
      if (res.status === 200) setMembers(res.body.data as Member[]);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMembers(); }, [org.id]);

  const referees = members.filter(m => m.orgRole === "referee");
  const nonReferees = members.filter(m => m.orgRole === "member");

  const handleToggleReferee = async (userId: string, currentRole: OrgRole) => {
    const newRole: OrgRole = currentRole === "referee" ? "member" : "referee";
    try {
      const res = await api.organizations.updateMemberRole({
        params: { id: org.id, userId },
        body: { role: newRole },
      });
      if (res.status === 200) {
        setMembers(prev => prev.map(m => m.id === userId ? { ...m, orgRole: newRole } : m));
      }
    } catch { }
  };

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", margin: "0 0 4px" }}>Referee Panel</h2>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
            {referees.length} referee{referees.length !== 1 ? "s" : ""} assigned
          </p>
        </div>
      </div>

      {/* Active referees */}
      <div className="glass-card" style={{ padding: 0, overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent-info, #3b82f6)" }}>gavel</span>
            <span style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "1px", color: "var(--text-secondary)" }}>ACTIVE REFEREES</span>
          </div>
        </div>

        {referees.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "32px", opacity: 0.3, display: "block", marginBottom: "8px" }}>gavel</span>
            No referees assigned yet. Promote members below.
          </div>
        ) : (
          referees.map(m => (
            <MemberRow key={m.id} member={m} actionLabel="Remove Referee" actionIcon="person_remove" actionColor="var(--destructive)" onAction={() => handleToggleReferee(m.id, m.orgRole)} />
          ))
        )}
      </div>

      {/* Available members to promote */}
      {nonReferees.length > 0 && (
        <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--text-muted)" }}>group</span>
              <span style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "1px", color: "var(--text-secondary)" }}>AVAILABLE MEMBERS</span>
            </div>
          </div>

          {nonReferees.map(m => (
            <MemberRow key={m.id} member={m} actionLabel="Make Referee" actionIcon="gavel" actionColor="var(--accent-info, #3b82f6)" onAction={() => handleToggleReferee(m.id, m.orgRole)} />
          ))}
        </div>
      )}
    </div>
  );
}

function MemberRow({ member, actionLabel, actionIcon, actionColor, onAction }: {
  member: Member; actionLabel: string; actionIcon: string; actionColor: string; onAction: () => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      padding: "12px 16px", borderBottom: "1px solid var(--border-color)",
      transition: "background 0.15s",
    }}>
      {/* Avatar */}
      <div style={{
        width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", flexShrink: 0,
        backgroundColor: "var(--bg-secondary)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {member.avatar ? (
          <img src={member.avatar} alt={member.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--text-muted)" }}>person</span>
        )}
      </div>

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>
          {member.displayName || member.username}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>@{member.username} · Lvl {member.level}</div>
      </div>

      {/* Action */}
      <button
        onClick={onAction}
        className="btn btn-secondary"
        style={{
          fontSize: "11px", padding: "6px 12px",
          color: actionColor,
          borderColor: `color-mix(in srgb, ${actionColor} 30%, transparent)`,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{actionIcon}</span>
        {actionLabel}
      </button>
    </div>
  );
}
