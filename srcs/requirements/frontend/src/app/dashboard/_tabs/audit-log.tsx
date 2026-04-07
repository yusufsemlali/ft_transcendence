"use client";

/* ── Audit Log Tab ── */
/* No backend audit API exists yet — showing a visual timeline with static demo entries. */

const DEMO_ENTRIES: { icon: string; action: string; actor: string; detail: string; time: string; color: string }[] = [
  { icon: "login",        action: "Session Started",     actor: "You",         detail: "Accessed the organization dashboard",                     time: "Just now",    color: "var(--accent-success, #22c55e)" },
  { icon: "person_add",   action: "Member Added",        actor: "System",      detail: "A new member was invited to the organization",            time: "2 min ago",   color: "var(--primary)" },
  { icon: "edit",         action: "Settings Updated",    actor: "Admin",       detail: "Organization description was modified",                   time: "15 min ago",  color: "var(--accent-info, #3b82f6)" },
  { icon: "emoji_events", action: "Tournament Created",  actor: "Admin",       detail: "New tournament 'Spring Championship' was created",        time: "1 hour ago",  color: "var(--accent-warning, #f59e0b)" },
  { icon: "shield_person",action: "Role Changed",        actor: "Owner",       detail: "User role updated from member to referee",                time: "3 hours ago", color: "var(--accent-secondary, #a855f7)" },
  { icon: "group_remove", action: "Member Removed",      actor: "Admin",       detail: "A member was removed from the organization",              time: "1 day ago",   color: "var(--destructive)" },
  { icon: "add_circle",   action: "Organization Created",actor: "Owner",       detail: "The organization was created",                            time: "3 days ago",  color: "var(--primary)" },
];

export function AuditLogTab() {
  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", margin: "0 0 4px" }}>Audit Log</h2>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>A chronological log of all actions in this organization.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-secondary" style={{ fontSize: "11px", padding: "6px 14px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>filter_list</span>
            Filter
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
        {DEMO_ENTRIES.map((entry, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: "14px",
            padding: "14px 16px",
            borderBottom: i < DEMO_ENTRIES.length - 1 ? "1px solid var(--border-color)" : "none",
            position: "relative",
          }}>
            {/* Timeline line */}
            {i < DEMO_ENTRIES.length - 1 && (
              <div style={{
                position: "absolute", left: "31px", top: "42px", bottom: "-2px",
                width: "1px", background: "var(--border-color)",
              }} />
            )}

            {/* Icon */}
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
              background: `color-mix(in srgb, ${entry.color} 12%, transparent)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", zIndex: 1,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: entry.color }}>{entry.icon}</span>
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>{entry.action}</span>
                <span style={{
                  fontSize: "10px", fontWeight: "500", padding: "2px 6px", borderRadius: "4px",
                  background: "color-mix(in srgb, var(--text-muted) 10%, transparent)",
                  color: "var(--text-muted)",
                }}>{entry.actor}</span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4" }}>{entry.detail}</div>
            </div>

            {/* Time */}
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", flexShrink: 0, whiteSpace: "nowrap", paddingTop: "2px" }}>
              {entry.time}
            </span>
          </div>
        ))}
      </div>

      {/* Info */}
      <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "16px", textAlign: "center", opacity: 0.5 }}>
        Showing demo audit entries. Full audit logging will be available in a future update.
      </p>
    </div>
  );
}
