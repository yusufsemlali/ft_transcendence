"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api/api";
import type { Organization } from "@ft-transcendence/contracts";

/* ── Sidebar Item ── */
function SidebarItem({
  icon, label, active, onClick, badge, href
}: {
  icon: string; label: string; active?: boolean; onClick?: () => void; badge?: string; href?: string;
}) {
  const inner = (
    <>
      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{icon}</span>
      <span className="dashboard-sidebar-label">{label}</span>
      {badge && <span className="dashboard-sidebar-badge">{badge}</span>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={active ? "dashboard-sidebar-item active" : "dashboard-sidebar-item"}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={active ? "dashboard-sidebar-item active" : "dashboard-sidebar-item"}
    >
      {inner}
    </button>
  );
}

/* ── Stat Widget ── */
function StatWidget({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: string }) {
  return (
    <div className="glass-card dashboard-stat-widget">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="dashboard-stat-label">{label}</div>
          <div className="dashboard-stat-value" style={{ color: accent || "var(--text-primary)" }}>{value}</div>
        </div>
        <div className="dashboard-stat-icon-wrap" style={{ background: accent ? `color-mix(in srgb, ${accent} 15%, transparent)` : undefined }}>
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: accent || "var(--text-muted)" }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Empty State Panel ── */
function EmptyPanel({ icon, title, subtitle, actionLabel, onAction }: {
  icon: string; title: string; subtitle: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <div className="glass-card dashboard-empty-panel">
      <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "var(--text-muted)", opacity: 0.3 }}>{icon}</span>
      <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--text-primary)", margin: "16px 0 8px" }}>{title}</h3>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: "320px", lineHeight: "1.5" }}>{subtitle}</p>
      {actionLabel && (
        <button className="btn btn-primary" style={{ marginTop: "20px", fontSize: "11px", padding: "8px 20px" }} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* ── Activity Row ── */
function ActivityRow({ icon, text, time, accent }: { icon: string; text: string; time: string; accent?: string }) {
  return (
    <div className="dashboard-activity-row">
      <div className="dashboard-activity-dot" style={{ background: accent || "var(--primary)" }} />
      <span className="material-symbols-outlined" style={{ fontSize: "16px", color: accent || "var(--text-muted)" }}>{icon}</span>
      <span style={{ flex: 1, fontSize: "13px", color: "var(--text-secondary)" }}>{text}</span>
      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{time}</span>
    </div>
  );
}

/* ── Main Dashboard ── */
export default function DashboardPage() {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: "overview",    label: "Overview",    icon: "dashboard" },
    { id: "tournaments", label: "Tournaments", icon: "emoji_events" },
    { id: "members",     label: "Members",     icon: "group" },
    { id: "activity",    label: "Activity",    icon: "timeline" },
    { id: "settings",    label: "Settings",    icon: "settings" },
  ];

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await api.organizations.getOrganizations();
        if (res.status === 200) {
          setOrgs(res.body.data);
          if (res.body.data.length > 0) setSelectedOrg(res.body.data[0]);
        }
      } catch { }
      finally { setLoading(false); }
    };
    fetchOrgs();
  }, []);

  return (
    <div className="dashboard-shell">
      {/* ── SIDEBAR ── */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Sidebar header — logo + brand */}
        <div className="dashboard-sidebar-header">
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <div className="dashboard-sidebar-logo">
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--primary)" }}>trophy</span>
            </div>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>tournify</span>
          </Link>
          <button className="dashboard-sidebar-close" onClick={() => setSidebarOpen(false)}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
          </button>
        </div>

        {/* Organization Switcher */}
        <div className="dashboard-sidebar-divider" />
        <div className="dashboard-sidebar-section-title">
          <span>Organization</span>
          <button onClick={() => {}} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0, display: "flex" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>
          </button>
        </div>
        <div className="dashboard-sidebar-section">
          {loading ? (
            <div style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: "12px" }}>Loading...</div>
          ) : orgs.length === 0 ? (
            <SidebarItem icon="add_business" label="Create Organization" onClick={() => {}} />
          ) : (
            orgs.map(org => (
              <SidebarItem
                key={org.id}
                icon="workspaces"
                label={org.name}
                active={selectedOrg?.id === org.id}
                onClick={() => { setSelectedOrg(org); setSidebarOpen(false); }}
              />
            ))
          )}
        </div>

        {/* Tournament Operations */}
        <div className="dashboard-sidebar-divider" />
        <div className="dashboard-sidebar-section-title">
          <span>Tournaments</span>
        </div>
        <div className="dashboard-sidebar-section">
          <SidebarItem icon="emoji_events" label="All Tournaments" active={activeTab === "tournaments"} onClick={() => setActiveTab("tournaments")} />
          <SidebarItem icon="add_circle" label="Create Tournament" onClick={() => {}} />
          <SidebarItem icon="account_tree" label="Brackets" onClick={() => {}} />
          <SidebarItem icon="scoreboard" label="Live Matches" onClick={() => {}} badge="0" />
          <SidebarItem icon="leaderboard" label="Standings" onClick={() => {}} />
          <SidebarItem icon="calendar_month" label="Schedule" onClick={() => {}} />
        </div>

        {/* Administration */}
        <div className="dashboard-sidebar-divider" />
        <div className="dashboard-sidebar-section-title">
          <span>Administration</span>
        </div>
        <div className="dashboard-sidebar-section">
          <SidebarItem icon="group" label="Members" active={activeTab === "members"} onClick={() => setActiveTab("members")} />
          <SidebarItem icon="shield_person" label="Roles & Permissions" onClick={() => {}} />
          <SidebarItem icon="person_add" label="Invite Players" onClick={() => {}} />
          <SidebarItem icon="gavel" label="Referee Panel" onClick={() => {}} />
          <SidebarItem icon="history" label="Audit Log" active={activeTab === "activity"} onClick={() => setActiveTab("activity")} />
        </div>

        {/* Configuration */}
        <div className="dashboard-sidebar-divider" />
        <div className="dashboard-sidebar-section-title">
          <span>Configure</span>
        </div>
        <div className="dashboard-sidebar-section">
          <SidebarItem icon="tune" label="Org Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
          <SidebarItem icon="sports" label="Sport Modes" onClick={() => {}} />
          <SidebarItem icon="webhook" label="Integrations" onClick={() => {}} />
        </div>

        {/* Sidebar footer */}
        <div style={{ marginTop: "auto" }}>
          <div className="dashboard-sidebar-divider" />
          <div className="dashboard-sidebar-section">
            <SidebarItem icon="dashboard" label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
            <SidebarItem icon="help_outline" label="Documentation" href="/about" />
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="dashboard-main">

        {/* Top Bar (Jira-style) */}
        <div className="dashboard-topbar">
          {/* Left: mobile menu + search */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
            <button className="dashboard-topbar-btn show-mobile" onClick={() => setSidebarOpen(true)} style={{ display: "none" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>menu</span>
            </button>
            <div className="dashboard-search">
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--text-muted)" }}>search</span>
              <input
                type="text"
                placeholder="Search tournaments, members..."
                className="dashboard-search-input"
              />
            </div>
          </div>

          {/* Right: action icons + user */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button className="dashboard-topbar-btn" title="Notifications">
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>notifications</span>
            </button>
            <button className="dashboard-topbar-btn" title="Help">
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>help_outline</span>
            </button>
            <Link href="/settings" className="dashboard-topbar-btn" title="Settings">
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>settings</span>
            </Link>

            {user && (
              <Link href="/profile" className="dashboard-topbar-user" title={user.username}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                ) : (
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--primary)" }}>
                    {(user.displayName || user.username || "U").charAt(0).toUpperCase()}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>

        {/* Page title bar */}
        <div className="dashboard-title-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {selectedOrg ? (
              <div className="dashboard-org-avatar">
                {selectedOrg.logoUrl ? (
                  <img src={selectedOrg.logoUrl} alt={selectedOrg.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary)" }}>workspaces</span>
                )}
              </div>
            ) : null}
            <div>
              <h1 className="dashboard-title">{selectedOrg?.name || `Welcome, ${user?.displayName || user?.username || "Commander"}`}</h1>
              {selectedOrg?.description && (
                <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "2px" }}>{selectedOrg.description}</p>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button className="btn btn-secondary" style={{ fontSize: "11px", padding: "6px 14px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>share</span>
              Share
            </button>
            <button className="btn btn-primary" style={{ fontSize: "11px", padding: "6px 14px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>add</span>
              Create
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="dashboard-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`dashboard-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{tab.icon}</span>
              <span className="dashboard-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="dashboard-content animate-fade-in" key={activeTab}>

          {activeTab === "overview" && (
            <>
              {/* Stat row */}
              <div className="dashboard-stat-grid">
                <StatWidget icon="emoji_events" label="ACTIVE TOURNAMENTS" value="0" accent="var(--primary)" />
                <StatWidget icon="group" label="TOTAL MEMBERS" value={orgs.length > 0 ? "--" : "0"} accent="var(--accent-info)" />
                <StatWidget icon="sports_score" label="MATCHES TODAY" value="0" accent="var(--accent-success)" />
                <StatWidget icon="pending_actions" label="PENDING ACTIONS" value="0" accent="var(--accent-warning)" />
              </div>

              {/* Two-col layout */}
              <div className="dashboard-widget-grid">
                {/* Recent Activity */}
                <div className="glass-card dashboard-widget">
                  <div className="dashboard-widget-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--primary)" }}>timeline</span>
                      <span style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "1px", color: "var(--text-secondary)" }}>RECENT ACTIVITY</span>
                    </div>
                    <button className="btn btn-ghost" style={{ fontSize: "11px", padding: "4px 8px" }}>View All</button>
                  </div>

                  <div className="dashboard-widget-body">
                    {selectedOrg ? (
                      <div className="stack-xs">
                        <ActivityRow icon="login" text="You joined this organization" time="Just now" accent="var(--accent-success)" />
                        <ActivityRow icon="add_circle" text="Organization created" time="Recently" accent="var(--primary)" />
                      </div>
                    ) : (
                      <EmptyPanel
                        icon="history"
                        title="No recent activity"
                        subtitle="Create or join an organization to start seeing activity here."
                      />
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-card dashboard-widget">
                  <div className="dashboard-widget-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--accent-secondary)" }}>bolt</span>
                      <span style={{ fontSize: "12px", fontWeight: "600", letterSpacing: "1px", color: "var(--text-secondary)" }}>QUICK ACTIONS</span>
                    </div>
                  </div>
                  <div className="dashboard-widget-body">
                    <div className="dashboard-quick-actions">
                      <button className="dashboard-quick-action-btn">
                        <span className="material-symbols-outlined">add_business</span>
                        <span>Create Org</span>
                      </button>
                      <button className="dashboard-quick-action-btn">
                        <span className="material-symbols-outlined">emoji_events</span>
                        <span>New Tournament</span>
                      </button>
                      <button className="dashboard-quick-action-btn">
                        <span className="material-symbols-outlined">person_add</span>
                        <span>Invite Member</span>
                      </button>
                      <button className="dashboard-quick-action-btn">
                        <span className="material-symbols-outlined">tune</span>
                        <span>Configure</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full-width onboarding card */}
              {!selectedOrg && (
                <div className="glass-card dashboard-onboarding">
                  <div className="dashboard-onboarding-content">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                      <span className="badge" style={{ backgroundColor: "var(--accent-secondary)", color: "white" }}>GETTING STARTED</span>
                    </div>
                    <h2 style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: "300", color: "var(--text-primary)", marginBottom: "12px" }}>
                      Initialize Your First Organization
                    </h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "500px", lineHeight: "1.6", marginBottom: "24px" }}>
                      Organizations are the foundation of your tournament infrastructure. Create one to start managing brackets, members, and competitions.
                    </p>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <button className="btn btn-primary" style={{ padding: "12px 28px", fontSize: "12px", fontWeight: "700", letterSpacing: "1px" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add_business</span>
                        CREATE ORGANIZATION
                      </button>
                      <button className="btn btn-secondary" style={{ padding: "12px 28px", fontSize: "12px" }}>
                        Learn More
                      </button>
                    </div>
                  </div>
                  <div className="dashboard-onboarding-visual hide-mobile">
                    <div className="dashboard-onboarding-card-mock">
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-info)" }} />
                        <div style={{ display: "flex", gap: "8px" }}>
                          <div style={{ width: "16px", height: "3px", borderRadius: "2px", background: "var(--border-color)" }} />
                          <div style={{ width: "32px", height: "3px", borderRadius: "2px", background: "var(--border-color)" }} />
                        </div>
                      </div>
                      <div style={{ width: "60%", height: "6px", borderRadius: "3px", background: "var(--primary)", marginBottom: "16px", opacity: 0.6 }} />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div style={{ height: "48px", borderRadius: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)" }} />
                        <div style={{ height: "48px", borderRadius: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)" }} />
                      </div>
                      <div style={{ width: "100%", height: "64px", borderRadius: "6px", background: "var(--gradient-prism)", opacity: 0.06, marginTop: "8px" }} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "tournaments" && (
            <EmptyPanel
              icon="emoji_events"
              title="Tournament Hub"
              subtitle="Create and manage tournaments for your organization. Configure brackets, track matches, and crown champions."
              actionLabel="+ Create Tournament"
            />
          )}

          {activeTab === "members" && (
            <EmptyPanel
              icon="group"
              title="Team Roster"
              subtitle="Manage your organization's members, assign roles, and coordinate your staff."
              actionLabel="+ Invite Member"
            />
          )}

          {activeTab === "activity" && (
            <EmptyPanel
              icon="timeline"
              title="Activity Feed"
              subtitle="A chronological log of all operations, score submissions, and administrative actions."
            />
          )}

          {activeTab === "settings" && (
            <EmptyPanel
              icon="settings"
              title="Organization Settings"
              subtitle="Configure your organization's profile, visibility, integrations, and danger zone."
              actionLabel="Open Settings"
            />
          )}
        </div>
      </main>
    </div>
  );
}
