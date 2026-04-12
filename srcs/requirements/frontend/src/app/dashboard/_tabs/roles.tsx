"use client";

import type { Organization } from "@ft-transcendence/contracts";
import { ORG_ROLES } from "@ft-transcendence/contracts";

/* ── Permission matrix ── */
const PERMISSIONS: { label: string; icon: string; roles: Record<string, boolean> }[] = [
  { label: "View tournaments",         icon: "visibility",       roles: { owner: true, admin: true, referee: true, member: true } },
  { label: "Join tournaments",         icon: "how_to_reg",       roles: { owner: true, admin: true, referee: true, member: true } },
  { label: "Create tournaments",       icon: "add_circle",       roles: { owner: true, admin: true, referee: false, member: false } },
  { label: "Edit tournaments",         icon: "edit",             roles: { owner: true, admin: true, referee: false, member: false } },
  { label: "Delete tournaments",       icon: "delete",           roles: { owner: true, admin: false, referee: false, member: false } },
  { label: "Manage members",           icon: "group",            roles: { owner: true, admin: true, referee: false, member: false } },
  { label: "Assign roles",             icon: "shield_person",    roles: { owner: true, admin: true, referee: false, member: false } },
  { label: "Officiate matches",        icon: "gavel",            roles: { owner: true, admin: true, referee: true, member: false } },
  { label: "Submit scores",            icon: "scoreboard",       roles: { owner: true, admin: true, referee: true, member: false } },
  { label: "Edit org settings",        icon: "settings",         roles: { owner: true, admin: true, referee: false, member: false } },
  { label: "Delete organization",      icon: "dangerous",        roles: { owner: true, admin: false, referee: false, member: false } },
  { label: "View audit log",           icon: "history",          roles: { owner: true, admin: true, referee: false, member: false } },
];

const ROLE_META: Record<string, { label: string; color: string; icon: string; description: string }> = {
  owner:   { label: "Owner",   color: "var(--accent-warning, #f59e0b)", icon: "crown",         description: "Full control. Can delete the organization." },
  admin:   { label: "Admin",   color: "var(--primary)",                  icon: "shield_person", description: "Can manage members, tournaments, and settings." },
  referee: { label: "Referee", color: "var(--accent-info, #3b82f6)",     icon: "gavel",         description: "Can officiate matches and submit scores." },
  member:  { label: "Member",  color: "var(--text-muted)",               icon: "person",        description: "Can view and join tournaments." },
};

export function RolesTab({ org: _org }: { org: Organization }) {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", margin: "0 0 4px" }}>Roles & Permissions</h2>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>View the permission matrix for each role in your organization.</p>
      </div>

      {/* Role cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(220px, 100%), 1fr))", gap: "12px", marginBottom: "28px" }}>
        {ORG_ROLES.map(role => {
          const meta = ROLE_META[role];
          return (
            <div key={role} className="glass-card" style={{ padding: "16px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "8px", flexShrink: 0,
                background: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: meta.color }}>{meta.icon}</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: meta.color }}>{meta.label}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", lineHeight: "1.4" }}>{meta.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission matrix */}
      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--primary)" }}>verified_user</span>
            <span style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "1px", color: "var(--text-secondary)" }}>PERMISSION MATRIX</span>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ textAlign: "left", padding: "10px 16px", color: "var(--text-muted)", fontWeight: "500", fontSize: "11px", letterSpacing: "0.5px" }}>Permission</th>
                {ORG_ROLES.map(role => (
                  <th key={role} style={{ textAlign: "center", padding: "10px 12px", color: ROLE_META[role].color, fontWeight: "600", fontSize: "11px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                    {ROLE_META[role].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((perm, i) => (
                <tr key={perm.label} style={{ borderBottom: i < PERMISSIONS.length - 1 ? "1px solid var(--border-color)" : "none" }}>
                  <td style={{ padding: "10px 16px", color: "var(--text-primary)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "14px", color: "var(--text-muted)", opacity: 0.5 }}>{perm.icon}</span>
                      {perm.label}
                    </div>
                  </td>
                  {ORG_ROLES.map(role => (
                    <td key={role} style={{ textAlign: "center", padding: "10px 12px" }}>
                      {perm.roles[role] ? (
                        <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent-success, #22c55e)" }}>check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--text-muted)", opacity: 0.2 }}>cancel</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
