"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BracketState, StandingsEntry } from "@ft-transcendence/contracts";
import { BracketView, MatchCard, StandingsTable } from "@/components/brackets";
import { Page } from "@/components/layout/Page";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import api from "@/lib/api/api";
import { formatApiErrorBody, toastApiError } from "@/lib/api-error";
import { useAuth } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PublicTab = "overview" | "bracket" | "matches" | "standings";

const TABS: Array<{ id: PublicTab; label: string; icon: string }> = [
  { id: "overview", label: "Overview", icon: "info" },
  { id: "bracket", label: "Bracket", icon: "account_tree" },
  { id: "matches", label: "Matches", icon: "scoreboard" },
  { id: "standings", label: "Standings", icon: "leaderboard" },
];

const BRACKET_VISIBLE_STATUSES = new Set(["upcoming", "ongoing", "completed"]);

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function statusBadgeVariant(status: string): "default" | "secondary" | "outline" | "success" {
  if (status === "completed") return "success";
  if (status === "draft") return "outline";
  if (status === "registration") return "secondary";
  return "default";
}

function StateCard({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <Page className="max-w-[900px]">
      <Card className="mx-auto text-center">
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {actionLabel && actionHref && (
          <Link href={actionHref} className="btn btn-primary btn-size-md mt-6 inline-flex">
            {actionLabel}
          </Link>
        )}
      </Card>
    </Page>
  );
}

export function TournamentDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<PublicTab>("overview");

  const validId = UUID_RE.test(id);

  const detailQuery = useQuery({
    queryKey: ["public-tournament", id],
    queryFn: async () => {
      const res = await api.tournaments.getTournamentById({ params: { id } });
      if (res.status !== 200) {
        if (res.status !== 404) {
          toastApiError(res.body, "Failed to load tournament");
        }
        throw new Error("Not found");
      }
      return res.body.data;
    },
    enabled: validId,
  });

  const bracketQuery = useQuery<BracketState>({
    queryKey: ["bracket-state", id],
    queryFn: async () => {
      const res = await api.matches.getBracketState({ params: { tournamentId: id } });
      if (res.status !== 200) throw new Error("Failed to load bracket");
      return res.body as BracketState;
    },
    enabled: validId && !!detailQuery.data && BRACKET_VISIBLE_STATUSES.has(detailQuery.data.status),
  });

  const standingsQuery = useQuery<StandingsEntry[]>({
    queryKey: ["standings", id],
    queryFn: async () => {
      const res = await api.matches.getStandings({ params: { tournamentId: id } });
      if (res.status !== 200) throw new Error("Failed to load standings");
      return res.body as StandingsEntry[];
    },
    enabled:
      validId &&
      activeTab === "standings" &&
      !!detailQuery.data &&
      BRACKET_VISIBLE_STATUSES.has(detailQuery.data.status),
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await api.tournaments.joinLobby({ params: { id }, body: {} });
      if (res.status !== 201) {
        throw new Error(formatApiErrorBody(res.body, "Could not join lobby"));
      }
      return res.body;
    },
    onSuccess: (body: any) => {
      toast.success(
        body.state === "COMPETITOR_CREATED"
          ? "You are registered. Opening lobby..."
          : "Joined the lobby!",
      );
      queryClient.invalidateQueries({ queryKey: ["public-tournament", id] });
      router.push(`/tournaments/${id}/lobby`);
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  if (!validId) {
    return (
      <StateCard
        title="Invalid link"
        description="This tournament URL is not valid."
        actionLabel="Back to tournaments"
        actionHref="/tournaments"
      />
    );
  }

  if (detailQuery.isPending) {
    return (
      <Page className="max-w-[900px]">
        <Card className="mx-auto text-center text-muted-foreground">Loading tournament...</Card>
      </Page>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <StateCard
        title="Tournament not found"
        description="It may be private, still in draft, or removed."
        actionLabel="Browse tournaments"
        actionHref="/tournaments"
      />
    );
  }

  const t = detailQuery.data;
  const callbackUrl = `/tournaments/${id}`;
  const showBracketTabs = BRACKET_VISIBLE_STATUSES.has(t.status);
  const visibleTabs = showBracketTabs ? TABS : TABS.filter((tab) => tab.id === "overview");

  return (
    <Page className="tournament-shell">
      <div>
        <Link
          href="/tournaments"
          className="tournament-back-link"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          All tournaments
        </Link>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="tournament-hero-media">
          <img
            src={t.bannerUrl || "/images/leage.jpeg"}
            alt={t.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          <Badge
            variant={statusBadgeVariant(t.status)}
            className="absolute right-4 top-4 border capitalize"
          >
            {formatLabel(t.status)}
          </Badge>
        </div>

        <div className="tournament-hero-content">
          <p className="mb-3 text-sm text-muted-foreground">
            <span className="font-semibold text-primary">{t.sportName}</span>
            <span className="mx-2 opacity-40">.</span>
            Hosted by <strong className="text-foreground">{t.organizationName}</strong>
          </p>

          <h1 className="mb-6 text-4xl font-semibold leading-tight sm:text-5xl">{t.name}</h1>

          <div className="tournament-meta">
            <Badge variant="outline" className="capitalize">
              {formatLabel(t.bracketType)}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {t.mode}
            </Badge>
            <Badge variant="outline">
              {t.minParticipants}-{t.lobbyCapacity} participants
            </Badge>
            {t.prizePool && <Badge variant="success">{t.prizePool}</Badge>}

            <div className="tournament-meta-actions">
              {user ? (
                <>
                  {t.status === "registration" && (
                    <button
                      type="button"
                      className="btn btn-primary btn-size-md"
                      disabled={joinMutation.isPending}
                      onClick={() => joinMutation.mutate()}
                    >
                      {joinMutation.isPending ? "Joining..." : "Join lobby"}
                    </button>
                  )}
                  {t.status !== "draft" && (
                    <Link
                      href={`/tournaments/${id}/lobby`}
                      className="btn btn-secondary btn-size-md"
                    >
                      <span className="material-symbols-outlined text-sm">groups</span>
                      Lobby
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                  className="btn btn-primary btn-size-md"
                >
                  Log in to join
                </Link>
              )}
            </div>
          </div>
        </div>

        {visibleTabs.length > 1 && (
          <div className="ds-tabs-wrap">
            <div className="ds-tabs-list">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={cn(
                    "ds-tab",
                    activeTab === tab.id && "is-active",
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="material-symbols-outlined text-base">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="tournament-stack">
        {activeTab === "overview" && <OverviewContent tournament={t} />}

        {activeTab === "bracket" && (
          <div>
            {bracketQuery.isPending && (
              <Card className="ds-panel-card">
                <div className="ds-empty-state">Loading bracket...</div>
              </Card>
            )}
            {bracketQuery.data && <BracketView data={bracketQuery.data} />}
            {bracketQuery.isError && (
              <Card className="ds-panel-card">
                <div className="ds-empty-state">Could not load bracket.</div>
              </Card>
            )}
          </div>
        )}

        {activeTab === "matches" && <MatchesContent bracketData={bracketQuery.data ?? null} />}

        {activeTab === "standings" && (
          <Card className="ds-panel-card">
            {standingsQuery.isPending && (
              <div className="ds-empty-state">Loading standings...</div>
            )}
            {standingsQuery.data && detailQuery.data && (
              <StandingsTable
                standings={standingsQuery.data}
                bracketType={detailQuery.data.bracketType as any}
              />
            )}
          </Card>
        )}
      </div>
    </Page>
  );
}

function OverviewContent({ tournament: t }: { tournament: any }) {
  return (
    <div className="ds-stack-lg">
      {t.description && (
        <Card className="ds-panel-card">
          <h3 className="ds-panel-title">About</h3>
          <p className="ds-copy">{t.description}</p>
        </Card>
      )}

      <Card className="ds-panel-card">
        <h3 className="ds-panel-title">Details</h3>
        <dl className="tournament-details-grid">
          <div className="tournament-details-item">
            <dt className="tournament-details-label">Mode</dt>
            <dd className="tournament-details-value capitalize">{t.mode}</dd>
          </div>
          <div className="tournament-details-item">
            <dt className="tournament-details-label">Bracket</dt>
            <dd className="tournament-details-value capitalize">{formatLabel(t.bracketType)}</dd>
          </div>
          <div className="tournament-details-item">
            <dt className="tournament-details-label">Team Size</dt>
            <dd className="tournament-details-value">
              {t.minTeamSize === t.maxTeamSize
                ? t.minTeamSize
                : `${t.minTeamSize}-${t.maxTeamSize}`}
            </dd>
          </div>
          <div className="tournament-details-item">
            <dt className="tournament-details-label">Participants</dt>
            <dd className="tournament-details-value">
              {t.minParticipants}-{t.lobbyCapacity}
            </dd>
          </div>
          <div className="tournament-details-item">
            <dt className="tournament-details-label">Prize</dt>
            <dd className="tournament-details-value text-green-400">{t.prizePool || "-"}</dd>
          </div>
          {t.entryFee > 0 && (
            <div className="tournament-details-item">
              <dt className="tournament-details-label">Entry Fee</dt>
              <dd className="tournament-details-value">{t.entryFee}</dd>
            </div>
          )}
          <div className="tournament-details-item">
            <dt className="tournament-details-label">Scoring</dt>
            <dd className="tournament-details-value capitalize">
              {t.scoringType ? formatLabel(t.scoringType) : "-"}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}

function MatchesContent({ bracketData }: { bracketData: BracketState | null }) {
  const [roundFilter, setRoundFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const allMatches = useMemo(() => {
    if (!bracketData) return [];
    return bracketData.rounds.flatMap((r) =>
      r.matches.map((m) => ({ ...m, roundLabel: r.label, roundNumber: String(r.number) })),
    );
  }, [bracketData]);

  const filtered = useMemo(
    () =>
      allMatches.filter((m) => {
        if (roundFilter !== "all" && m.roundNumber !== roundFilter) return false;
        if (statusFilter !== "all" && m.status !== statusFilter) return false;
        return true;
      }),
    [allMatches, roundFilter, statusFilter],
  );

  if (!bracketData || bracketData.rounds.length === 0) {
    return (
      <Card className="ds-panel-card">
        <div className="ds-empty-state">No matches available yet.</div>
      </Card>
    );
  }

  return (
    <div className="ds-stack-md">
      <Card size="sm" className="ds-panel ds-panel-card-sm">
        <div className="ds-filters-row">
          <Select value={roundFilter} onValueChange={setRoundFilter}>
            <SelectTrigger className="ds-select-compact">
              <SelectValue placeholder="All rounds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rounds</SelectItem>
              {bracketData.rounds.map((r) => (
                <SelectItem key={r.number} value={String(r.number)}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="ds-select-compact">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="ongoing">Live</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ds-grid-cards">
          {filtered.map((match) => (
            <div key={match.id}>
              <MatchCard match={match} variant="default" />
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="ds-empty-state">No matches match your filters.</div>
        )}
      </Card>
    </div>
  );
}
