"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Organization, Tournament } from "@ft-transcendence/contracts";
import api from "@/lib/api/api";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";
import { EmptyPanel } from "./empty-panel";

/* Tab imports — Org level */
import { OverviewTab } from "../_tabs/overview";
import { TournamentsTab } from "../_tabs/tournaments";
import { MembersTab } from "../_tabs/members";
import { ActivityTab } from "../_tabs/activity";
import { SettingsTab } from "../_tabs/settings";

/* ═══════════════════════════════════════
   SECTION / PAGE DEFINITIONS
   ═══════════════════════════════════════ */

type OrgSection = "overview" | "tournaments" | "admin" | "config";
type TournamentPage = "overview" | "brackets" | "matches" | "standings" | "schedule" | "settings";

interface TabDef { id: string; label: string; icon: string }

const ORG_TABS: Record<OrgSection, TabDef[]> = {
  overview: [
    { id: "overview", label: "Overview", icon: "dashboard" },
  ],
  tournaments: [
    { id: "all",    label: "All Tournaments", icon: "emoji_events" },
    { id: "create", label: "Create",          icon: "add_circle" },
  ],
  admin: [
    { id: "members",  label: "Members",            icon: "group" },
    { id: "roles",    label: "Roles & Permissions", icon: "shield_person" },
    { id: "invite",   label: "Invite Players",     icon: "person_add" },
    { id: "referees", label: "Referee Panel",       icon: "gavel" },
    { id: "audit",    label: "Audit Log",           icon: "history" },
  ],
  config: [
    { id: "org-settings", label: "Org Settings",  icon: "tune" },
    { id: "sport-modes",  label: "Sport Modes",   icon: "sports" },
    { id: "integrations", label: "Integrations",  icon: "webhook" },
  ],
};

const TOURNAMENT_TABS: TabDef[] = [
  { id: "overview",  label: "Overview",  icon: "dashboard" },
  { id: "brackets",  label: "Brackets",  icon: "account_tree" },
  { id: "matches",   label: "Matches",   icon: "scoreboard" },
  { id: "standings", label: "Standings",  icon: "leaderboard" },
  { id: "schedule",  label: "Schedule",   icon: "calendar_month" },
  { id: "settings",  label: "Settings",  icon: "settings" },
];

const ORG_SECTION_META: Record<OrgSection, { title: string; icon: string }> = {
  overview:    { title: "Overview",       icon: "dashboard" },
  tournaments: { title: "Tournaments",    icon: "emoji_events" },
  admin:       { title: "Administration", icon: "admin_panel_settings" },
  config:      { title: "Configuration",  icon: "settings" },
};

const VALID_SECTIONS: OrgSection[] = ["overview", "tournaments", "admin", "config"];
const VALID_TPAGES: TournamentPage[] = ["overview", "brackets", "matches", "standings", "schedule", "settings"];

/* ═══════════════════════════════════════
   SHELL
   ═══════════════════════════════════════ */

export function Shell({ org, onBack }: { org: Organization; onBack: () => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial state from URL
  const urlSection = searchParams.get("s") as OrgSection | null;
  const urlPage = searchParams.get("p");
  const urlTournamentId = searchParams.get("t");
  const urlTournamentPage = searchParams.get("tp") as TournamentPage | null;

  const [section, setSection] = useState<OrgSection>(
    VALID_SECTIONS.includes(urlSection as OrgSection) ? urlSection! : "overview"
  );
  const [page, setPage] = useState(urlPage || "overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tournament-level navigation (null = org level)
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [tournamentPage, setTournamentPage] = useState<TournamentPage>(
    VALID_TPAGES.includes(urlTournamentPage as TournamentPage) ? urlTournamentPage! : "overview"
  );

  // Sync URL → state: restore tournament from URL on mount
  useEffect(() => {
    if (urlTournamentId && !activeTournament) {
      api.tournaments.listOrgTournaments({ params: { organizationId: org.id } })
        .then(res => {
          if (res.status === 200) {
            const found = res.body.find((t: Tournament) => t.id === urlTournamentId);
            if (found) setActiveTournament(found);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Sync state → URL
  const updateUrl = useCallback((s: OrgSection, p: string, tId?: string | null, tp?: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    // Always set org-level params
    if (s !== "overview" || p !== "overview") {
      params.set("s", s);
      params.set("p", p);
    } else {
      params.delete("s");
      params.delete("p");
    }

    // Tournament params
    if (tId) {
      params.set("t", tId);
      if (tp && tp !== "overview") params.set("tp", tp);
      else params.delete("tp");
    } else {
      params.delete("t");
      params.delete("tp");
    }

    const qs = params.toString();
    router.replace(`/dashboard${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [searchParams, router]);

  // Navigation helpers
  const navigateOrg = (s: OrgSection, p: string) => {
    setSection(s);
    setPage(p);
    setActiveTournament(null);
    setSidebarOpen(false);
    updateUrl(s, p, null, null);
  };

  const openTournament = (t: Tournament) => {
    setActiveTournament(t);
    setTournamentPage("overview");
    setSidebarOpen(false);
    updateUrl(section, page, t.id, "overview");
  };

  const navigateTournament = (p: TournamentPage) => {
    setTournamentPage(p);
    setSidebarOpen(false);
    updateUrl(section, page, activeTournament?.id, p);
  };

  const backToOrg = () => {
    setActiveTournament(null);
    setSection("tournaments");
    setPage("all");
    updateUrl("tournaments", "all", null, null);
  };


  /* ── Which tabs/content to render ── */
  const inTournament = activeTournament !== null;
  const tabs = inTournament ? TOURNAMENT_TABS : (ORG_TABS[section] ?? []);
  const activePageId = inTournament ? tournamentPage : page;

  return (
    <div className="dashboard-shell">
      <Sidebar
        org={org}
        section={section}
        page={page}
        navigateOrg={navigateOrg}
        activeTournament={activeTournament}
        tournamentPage={tournamentPage}
        navigateTournament={navigateTournament}
        backToOrg={backToOrg}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onBack={onBack}
      />

      <main className="dashboard-main">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />

        {/* ── Title Bar ── */}
        <div className="dashboard-title-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {inTournament ? (
              /* Tournament-level title */
              <>
                {activeTournament.bannerUrl ? (
                  <div className="dashboard-org-avatar" style={{ backgroundImage: `url(${activeTournament.bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                ) : (
                  <div className="dashboard-org-avatar" style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary)" }}>emoji_events</span>
                  </div>
                )}
                <div>
                  <h1 className="dashboard-title">{activeTournament.name}</h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "2px" }}>{org.name}</p>
                </div>
              </>
            ) : section === "overview" ? (
              /* Org overview title */
              <>
                <div className="dashboard-org-avatar">
                  {org.logoUrl ? (
                    <img src={org.logoUrl} alt={org.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary)" }}>workspaces</span>
                  )}
                </div>
                <div>
                  <h1 className="dashboard-title">{org.name}</h1>
                  {org.description && <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "2px" }}>{org.description}</p>}
                </div>
              </>
            ) : (
              /* Section-level title */
              <>
                <div className="dashboard-org-avatar" style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary)" }}>{ORG_SECTION_META[section].icon}</span>
                </div>
                <div>
                  <h1 className="dashboard-title">{ORG_SECTION_META[section].title}</h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "2px" }}>{org.name}</p>
                </div>
              </>
            )}
          </div>

          {/* Title bar actions */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {section === "overview" && !inTournament && (
              <>
                <button className="btn btn-secondary" style={{ fontSize: "11px", padding: "6px 14px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>share</span>
                  Share
                </button>
                <button className="btn btn-primary" style={{ fontSize: "11px", padding: "6px 14px" }} onClick={() => navigateOrg("tournaments", "create")}>
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>add</span>
                  New Tournament
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Tab Bar (hidden if only one tab) ── */}
        {tabs.length > 1 && (
          <div className="dashboard-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`dashboard-tab ${activePageId === tab.id ? "active" : ""}`}
                onClick={() => inTournament ? navigateTournament(tab.id as TournamentPage) : setPage(tab.id)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{tab.icon}</span>
                <span className="dashboard-tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Content ── */}
        <div className="dashboard-content animate-fade-in" key={inTournament ? `t-${activeTournament.id}-${tournamentPage}` : `${section}-${page}`}>

          {/* ═══ TOURNAMENT LEVEL ═══ */}
          {inTournament && (
            <>
              {tournamentPage === "overview"  && <EmptyPanel icon="dashboard"     title="Tournament Overview"  subtitle={`Overview for ${activeTournament.name}. Stats, participants, and progress will appear here.`} />}
              {tournamentPage === "brackets"  && <EmptyPanel icon="account_tree"  title="Brackets"             subtitle="View and manage the tournament bracket tree. Drag to rearrange seedings." />}
              {tournamentPage === "matches"   && <EmptyPanel icon="scoreboard"    title="Matches"              subtitle="Track live matches, submit scores, and review completed games." />}
              {tournamentPage === "standings"  && <EmptyPanel icon="leaderboard"   title="Standings"            subtitle="Current rankings, win rates, and point tables for all participants." />}
              {tournamentPage === "schedule"   && <EmptyPanel icon="calendar_month" title="Schedule"            subtitle="Plan match dates, set check-in windows, and manage the event timeline." />}
              {tournamentPage === "settings"   && <EmptyPanel icon="settings"      title="Tournament Settings"  subtitle="Edit tournament rules, visibility, and configuration." />}
            </>
          )}

          {/* ═══ ORG LEVEL ═══ */}
          {!inTournament && (
            <>
              {section === "overview" && <OverviewTab org={org} />}

              {section === "tournaments" && page === "all"    && <TournamentsTab org={org} onSelectTournament={openTournament} />}
              {section === "tournaments" && page === "create" && <TournamentsTab org={org} onSelectTournament={openTournament} initialCreate />}

              {section === "admin" && page === "members"  && <MembersTab org={org} />}
              {section === "admin" && page === "roles"    && <EmptyPanel icon="shield_person" title="Roles & Permissions" subtitle="Define custom roles and fine-tune member permissions for your organization." />}
              {section === "admin" && page === "invite"   && <EmptyPanel icon="person_add" title="Invite Players" subtitle="Send invitations to players via email or share an invite link." />}
              {section === "admin" && page === "referees" && <EmptyPanel icon="gavel" title="Referee Panel" subtitle="Assign referees to tournaments and manage match officiating." />}
              {section === "admin" && page === "audit"    && <ActivityTab />}

              {section === "config" && page === "org-settings" && <SettingsTab />}
              {section === "config" && page === "sport-modes"  && <EmptyPanel icon="sports" title="Sport Modes" subtitle="Browse and configure available sports and game modes for your tournaments." />}
              {section === "config" && page === "integrations" && <EmptyPanel icon="webhook" title="Integrations" subtitle="Connect external services like Discord, Twitch, and webhook notifications." />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
