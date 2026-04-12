"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import type { Organization, Tournament } from "@ft-transcendence/contracts";
import api from "@/lib/api/api";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";
/* Tab imports — Org level */
import { OverviewTab } from "../_tabs/overview";
import { TournamentsTab } from "../_tabs/tournaments";
import { MembersTab } from "../_tabs/members";
import { RolesTab } from "../_tabs/roles";
import { InviteTab } from "../_tabs/invite";
import { RefereesTab } from "../_tabs/referees";
import { OrgSettingsTab } from "../_tabs/org-settings";
import { SportModesTab } from "../_tabs/sport-modes";
import { IntegrationsTab } from "../_tabs/integrations";
import { TournamentSettingsTab } from "../_tabs/tournament-settings";
import { TournamentOverviewTab } from "../_tabs/tournament-overview";
import { LobbyTab } from "../_tabs/lobby";
import { BracketsTab } from "../_tabs/brackets";
import { MatchesTab } from "../_tabs/matches";
import { StandingsTab } from "../_tabs/standings";
import { ScheduleTab } from "../_tabs/schedule";

/* ═══════════════════════════════════════
   SECTION / PAGE DEFINITIONS
   ═══════════════════════════════════════ */

type OrgSection = "overview" | "tournaments" | "admin" | "config" | "tools";
type TournamentPage = "overview" | "lobby" | "brackets" | "matches" | "standings" | "schedule" | "settings";

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
  ],
  config: [
    { id: "org-settings", label: "Org Settings",  icon: "tune" },
    { id: "sport-modes",  label: "Sport Modes",   icon: "sports" },
    { id: "integrations", label: "Integrations",  icon: "webhook" },
  ],
  tools: [],
};

const ALL_TOURNAMENT_TABS: TabDef[] = [
  { id: "overview",  label: "Overview",  icon: "dashboard" },
  { id: "lobby",     label: "Lobby",     icon: "groups" },
  { id: "brackets",  label: "Brackets",  icon: "account_tree" },
  { id: "matches",   label: "Matches",   icon: "scoreboard" },
  { id: "standings", label: "Standings",  icon: "leaderboard" },
  { id: "schedule",  label: "Schedule",   icon: "calendar_month" },
  { id: "settings",  label: "Settings",  icon: "settings" },
];

function getTournamentTabs(status: string): TabDef[] {
  if (status === "draft") return ALL_TOURNAMENT_TABS.filter(t => t.id !== "lobby");
  return ALL_TOURNAMENT_TABS;
}

const ORG_SECTION_META: Record<OrgSection, { title: string; icon: string }> = {
  overview:    { title: "Overview",       icon: "dashboard" },
  tournaments: { title: "Tournaments",    icon: "emoji_events" },
  admin:       { title: "Administration", icon: "admin_panel_settings" },
  config:      { title: "Configuration",  icon: "settings" },
  tools:       { title: "Developer Tools", icon: "build" },
};

const VALID_SECTIONS: OrgSection[] = ["overview", "tournaments", "admin", "config", "tools"];
const VALID_TPAGES: TournamentPage[] = ["overview", "lobby", "brackets", "matches", "standings", "schedule", "settings"];

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
    (VALID_TPAGES as string[]).includes(urlTournamentPage || "") ? (urlTournamentPage as TournamentPage) : "overview"
  );

  // Sync URL → state: restore tournament from URL on mount
  useEffect(() => {
    if (urlTournamentId && !activeTournament) {
      api.tournaments.listOrgTournaments({ params: { organizationId: org.id } })
        .then((res: { status: number; body: unknown }) => {
          if (res.status === 200) {
            const found = (res.body as Tournament[]).find((t: Tournament) => t.id === urlTournamentId);
            if (found) setActiveTournament(found);
          }
        })
        .catch(() => {});
    }
  }, [org.id, urlTournamentId, activeTournament]);

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
  const tabs = inTournament ? getTournamentTabs(activeTournament.status) : (ORG_TABS[section as OrgSection] || []);
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
        <div className="dashboard-title-bar" style={{
            backgroundImage: inTournament && activeTournament.bannerUrl ? `url(${activeTournament.bannerUrl})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            borderBottom: inTournament ? "1px solid rgba(255,255,255,0.05)" : "1px solid var(--border-color)"
        }}>
          {/* Subtle Overlay to ensure text readability against the banner */}
          {inTournament && activeTournament.bannerUrl && (
            <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.85) 100%)",
                zIndex: 0
            }} />
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative", zIndex: 1 }}>
            {inTournament ? (
              /* Tournament-level title */
              <>
                <div style={{ 
                    width: "40px", 
                    height: "40px", 
                    borderRadius: "8px", 
                    overflow: "hidden", 
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "var(--background)",
                    flexShrink: 0
                }}>
                    {activeTournament.bannerUrl ? (
                        <Image src={activeTournament.bannerUrl} alt="Tournament banner" width={40} height={40} style={{ objectFit: "cover" }} priority />
                    ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary)" }}>emoji_events</span>
                        </div>
                    )}
                </div>
                <div>
                  <h1 className="dashboard-title" style={{ fontSize: "18px" }}>{activeTournament.name}</h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "0px" }}>{org.name}</p>
                </div>
              </>
            ) : section === "overview" ? (
              /* Org overview title */
              <>
                <div className="dashboard-org-avatar">
                  {org.logoUrl ? (
                    <Image src={org.logoUrl} alt={org.name} width={40} height={40} style={{ objectFit: "cover" }} priority />
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
                  <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "var(--primary)" }}>{ORG_SECTION_META[section as OrgSection].icon}</span>
                </div>
                <div>
                  <h1 className="dashboard-title">{ORG_SECTION_META[section as OrgSection].title}</h1>
                  <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "2px" }}>{org.name}</p>
                </div>
              </>
            )}
          </div>

          {/* Title bar actions */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", position: "relative", zIndex: 1 }}>
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
            {tabs.map((tab: TabDef) => (
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
              {tournamentPage === "overview"  && (
                <TournamentOverviewTab 
                    tournament={activeTournament} 
                    org={org}
                    onStatusChange={(updated: Tournament) => setActiveTournament(updated)}
                    onNavigate={(p: string) => navigateTournament(p as TournamentPage)}
                />
              )}
              {tournamentPage === "lobby" && activeTournament.status !== "draft" && (
                <LobbyTab
                    tournament={activeTournament}
                    org={org}
                />
              )}
              {tournamentPage === "brackets"  && <BracketsTab tournament={activeTournament} org={org} />}
              {tournamentPage === "matches"   && <MatchesTab tournament={activeTournament} org={org} />}
              {tournamentPage === "standings"  && <StandingsTab tournament={activeTournament} org={org} />}
              {tournamentPage === "schedule"   && <ScheduleTab tournament={activeTournament} org={org} />}
              {tournamentPage === "settings"   && (
                <TournamentSettingsTab 
                    tournament={activeTournament} 
                    org={org} 
                    onUpdate={(t: Tournament) => setActiveTournament(t)} 
                    onDelete={() => backToOrg()}
                />
              )}
            </>
          )}

          {/* ═══ ORG LEVEL ═══ */}
          {!inTournament && (
            <>
              {section === "overview" && <OverviewTab org={org} />}

              {section === "tournaments" && page === "all"    && <TournamentsTab org={org} onSelectTournament={openTournament} />}
              {section === "tournaments" && page === "create" && <TournamentsTab org={org} onSelectTournament={openTournament} initialCreate />}

              {section === "admin" && page === "members"  && <MembersTab org={org} />}
              {section === "admin" && page === "roles"    && <RolesTab org={org} />}
              {section === "admin" && page === "invite"   && <InviteTab org={org} />}
              {section === "admin" && page === "referees" && <RefereesTab org={org} />}

              {section === "config" && page === "org-settings" && <OrgSettingsTab org={org} />}
              {section === "config" && page === "sport-modes"  && <SportModesTab />}
              {section === "config" && page === "integrations" && <IntegrationsTab />}

            </>
          )}
        </div>
      </main>
    </div>
  );
}
