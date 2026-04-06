import type { Organization, Tournament } from "@ft-transcendence/contracts";
import { SidebarItem } from "./sidebar-item";

type OrgSection = "overview" | "tournaments" | "admin" | "config";
type TournamentPage = "overview" | "brackets" | "matches" | "standings" | "schedule" | "settings";

export function Sidebar({ org, section, page, navigateOrg, activeTournament, tournamentPage, navigateTournament, backToOrg, open, onClose, onBack }: {
  org: Organization;
  section: OrgSection;
  page: string;
  navigateOrg: (section: OrgSection, page: string) => void;
  activeTournament: Tournament | null;
  tournamentPage: TournamentPage;
  navigateTournament: (page: TournamentPage) => void;
  backToOrg: () => void;
  open: boolean;
  onClose: () => void;
  onBack: () => void;
}) {
  const goOrg = (s: OrgSection, p: string) => { navigateOrg(s, p); onClose(); };
  const goTournament = (p: TournamentPage) => { navigateTournament(p); onClose(); };

  const inTournament = activeTournament !== null;

  return (
    <aside className={`dashboard-sidebar ${open ? "open" : ""}`}>
      {/* ── Header ── */}
      <div className="dashboard-sidebar-header">
        <button
          onClick={inTournament ? backToOrg : onBack}
          style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--text-muted)" }}>arrow_back</span>
          <div className="dashboard-sidebar-logo">
            <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--primary)" }}>
              {inTournament ? "emoji_events" : "trophy"}
            </span>
          </div>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>
            {inTournament ? "Back to Org" : "tournify"}
          </span>
        </button>
        <button className="dashboard-sidebar-close" onClick={onClose}>
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
        </button>
      </div>

      {/* ── Context Header ── */}
      {inTournament ? (
        /* Tournament context */
        <div className="dashboard-sidebar-org-context">
          <div className="dashboard-org-card-avatar" style={{ width: "28px", height: "28px", borderRadius: "6px", background: activeTournament.bannerUrl ? undefined : "color-mix(in srgb, var(--primary) 10%, transparent)", backgroundImage: activeTournament.bannerUrl ? `url(${activeTournament.bannerUrl})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
            {!activeTournament.bannerUrl && (
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--primary)" }}>emoji_events</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeTournament.name}</div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{org.name}</div>
          </div>
        </div>
      ) : (
        /* Org context */
        <div className="dashboard-sidebar-org-context">
          <div className="dashboard-org-card-avatar" style={{ width: "28px", height: "28px", borderRadius: "6px" }}>
            {org.logoUrl ? (
              <img src={org.logoUrl} alt={org.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px" }} />
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "var(--primary)" }}>workspaces</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{org.name}</div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>/{org.slug}</div>
          </div>
        </div>
      )}

      {inTournament ? (
        /* ═══════════════════════════════════
           TOURNAMENT-LEVEL SIDEBAR
           ═══════════════════════════════════ */
        <>
          <div className="dashboard-sidebar-section" style={{ paddingTop: "8px" }}>
            <SidebarItem icon="dashboard"      label="Overview"  active={tournamentPage === "overview"}  onClick={() => goTournament("overview")} />
          </div>

          <div className="dashboard-sidebar-divider" />
          <div className="dashboard-sidebar-section-title"><span>Competition</span></div>
          <div className="dashboard-sidebar-section">
            <SidebarItem icon="account_tree"   label="Brackets"  active={tournamentPage === "brackets"}  onClick={() => goTournament("brackets")} />
            <SidebarItem icon="scoreboard"     label="Matches"   active={tournamentPage === "matches"}   onClick={() => goTournament("matches")} />
            <SidebarItem icon="leaderboard"    label="Standings"  active={tournamentPage === "standings"} onClick={() => goTournament("standings")} />
            <SidebarItem icon="calendar_month" label="Schedule"   active={tournamentPage === "schedule"}  onClick={() => goTournament("schedule")} />
          </div>

          <div className="dashboard-sidebar-divider" />
          <div className="dashboard-sidebar-section-title"><span>Manage</span></div>
          <div className="dashboard-sidebar-section">
            <SidebarItem icon="settings" label="Settings" active={tournamentPage === "settings"} onClick={() => goTournament("settings")} />
          </div>
        </>
      ) : (
        /* ═══════════════════════════════════
           ORG-LEVEL SIDEBAR
           ═══════════════════════════════════ */
        <>
          {/* Overview */}
          <div className="dashboard-sidebar-section" style={{ paddingTop: "8px" }}>
            <SidebarItem icon="dashboard" label="Overview" active={section === "overview"} onClick={() => goOrg("overview", "overview")} />
          </div>

          {/* Tournaments */}
          <div className="dashboard-sidebar-divider" />
          <div className="dashboard-sidebar-section-title"><span>Tournaments</span></div>
          <div className="dashboard-sidebar-section">
            <SidebarItem icon="emoji_events" label="All Tournaments"   active={section === "tournaments" && page === "all"}    onClick={() => goOrg("tournaments", "all")} />
            <SidebarItem icon="add_circle"   label="Create Tournament" active={section === "tournaments" && page === "create"} onClick={() => goOrg("tournaments", "create")} />
          </div>

          {/* Administration */}
          <div className="dashboard-sidebar-divider" />
          <div className="dashboard-sidebar-section-title"><span>Administration</span></div>
          <div className="dashboard-sidebar-section">
            <SidebarItem icon="group"         label="Members"            active={section === "admin" && page === "members"}  onClick={() => goOrg("admin", "members")} />
            <SidebarItem icon="shield_person" label="Roles & Permissions" active={section === "admin" && page === "roles"}   onClick={() => goOrg("admin", "roles")} />
            <SidebarItem icon="person_add"    label="Invite Players"     active={section === "admin" && page === "invite"}  onClick={() => goOrg("admin", "invite")} />
            <SidebarItem icon="gavel"         label="Referee Panel"      active={section === "admin" && page === "referees"} onClick={() => goOrg("admin", "referees")} />
            <SidebarItem icon="history"       label="Audit Log"          active={section === "admin" && page === "audit"}   onClick={() => goOrg("admin", "audit")} />
          </div>

          {/* Configure */}
          <div className="dashboard-sidebar-divider" />
          <div className="dashboard-sidebar-section-title"><span>Configure</span></div>
          <div className="dashboard-sidebar-section">
            <SidebarItem icon="tune"    label="Org Settings"  active={section === "config" && page === "org-settings"}  onClick={() => goOrg("config", "org-settings")} />
            <SidebarItem icon="sports"  label="Sport Modes"   active={section === "config" && page === "sport-modes"}   onClick={() => goOrg("config", "sport-modes")} />
            <SidebarItem icon="webhook" label="Integrations"  active={section === "config" && page === "integrations"} onClick={() => goOrg("config", "integrations")} />
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{ marginTop: "auto" }}>
        <div className="dashboard-sidebar-divider" />
        <div className="dashboard-sidebar-section">
          <SidebarItem icon="help_outline" label="Documentation" href="/about" />
        </div>
      </div>
    </aside>
  );
}
