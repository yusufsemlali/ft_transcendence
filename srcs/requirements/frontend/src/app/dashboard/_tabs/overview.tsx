import type { Organization } from "@ft-transcendence/contracts";
import { StatWidget } from "../_components/stat-widget";

export function OverviewTab({ org }: { org: Organization }) {
  return (
    <>
      {/* Stats */}
      <div className="dashboard-stat-grid">
        <StatWidget icon="emoji_events" label="ACTIVE TOURNAMENTS" value="0" accent="var(--primary)" />
        <StatWidget icon="group" label="TOTAL MEMBERS" value="--" accent="var(--accent-info)" />
        <StatWidget icon="sports_score" label="MATCHES TODAY" value="0" accent="var(--accent-success)" />
        <StatWidget icon="pending_actions" label="PENDING ACTIONS" value="0" accent="var(--accent-warning)" />
      </div>

      {/* Widgets */}
      <div className="dashboard-widget-grid">
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
                <span className="material-symbols-outlined">emoji_events</span>
                <span>New Tournament</span>
              </button>
              <button className="dashboard-quick-action-btn">
                <span className="material-symbols-outlined">person_add</span>
                <span>Invite Member</span>
              </button>
              <button className="dashboard-quick-action-btn">
                <span className="material-symbols-outlined">account_tree</span>
                <span>New Bracket</span>
              </button>
              <button className="dashboard-quick-action-btn">
                <span className="material-symbols-outlined">tune</span>
                <span>Configure</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
