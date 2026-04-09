"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api/api";
import { useAuth } from "@/lib/store/hooks";
import { toast } from "@/components/ui/sonner";
import { toastApiError, formatApiErrorBody } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { BracketView, StandingsTable, MatchCard } from "@/components/brackets";
import type { BracketState, StandingsEntry } from "@ft-transcendence/contracts";

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
        enabled: validId && activeTab === "standings" && !!detailQuery.data && BRACKET_VISIBLE_STATUSES.has(detailQuery.data.status),
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
                    ? "You are registered. Opening lobby…"
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
            <div className="page" style={{ padding: "48px 24px", textAlign: "center" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 600 }}>Invalid link</h1>
                <p style={{ color: "var(--text-muted)" }}>This tournament URL is not valid.</p>
                <Link href="/tournaments" className="btn btn-primary" style={{ marginTop: "24px", display: "inline-block" }}>
                    Back to tournaments
                </Link>
            </div>
        );
    }

    if (detailQuery.isPending) {
        return (
            <div className="page" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
                Loading tournament…
            </div>
        );
    }

    if (detailQuery.isError || !detailQuery.data) {
        return (
            <div className="page" style={{ padding: "48px 24px", textAlign: "center" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 600 }}>Tournament not found</h1>
                <p style={{ color: "var(--text-muted)" }}>
                    It may be private, still in draft, or removed.
                </p>
                <Link href="/tournaments" className="btn btn-primary" style={{ marginTop: "24px", display: "inline-block" }}>
                    Browse tournaments
                </Link>
            </div>
        );
    }

    const t = detailQuery.data;
    const callbackUrl = `/tournaments/${id}`;
    const showBracketTabs = BRACKET_VISIBLE_STATUSES.has(t.status);
    const visibleTabs = showBracketTabs ? TABS : TABS.filter((tab) => tab.id === "overview");

    return (
        <div
            className="page"
            style={{
                minHeight: "100vh",
                color: "var(--text-primary)",
                maxWidth: "1100px",
                margin: "0 auto",
                paddingBottom: "48px",
            }}
        >
            <div style={{ marginBottom: "20px" }}>
                <Link
                    href="/tournaments"
                    style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "none" }}
                >
                    ← All tournaments
                </Link>
            </div>

            {/* Hero card */}
            <div
                className="glass-card"
                style={{ overflow: "hidden", border: "1px solid var(--border-color)", marginBottom: "0" }}
            >
                <div style={{ height: "200px", background: "var(--bg-tertiary)", position: "relative" }}>
                    <img
                        src={t.bannerUrl || "/images/leage.jpeg"}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: "linear-gradient(to top, var(--bg-primary), transparent 40%)",
                        }}
                    />
                    <span
                        className="badge"
                        style={{
                            position: "absolute",
                            top: "16px",
                            right: "16px",
                            textTransform: "uppercase",
                            fontSize: "11px",
                            letterSpacing: "0.05em",
                        }}
                    >
                        {t.status}
                    </span>
                </div>

                <div style={{ padding: "24px 28px 16px" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "13px", color: "var(--text-muted)" }}>
                        <span style={{ color: "var(--accent-info)", fontWeight: 600 }}>{t.sportName}</span>
                        <span style={{ margin: "0 8px", opacity: 0.4 }}>·</span>
                        Hosted by{" "}
                        <strong style={{ color: "var(--text-primary)" }}>{t.organizationName}</strong>
                    </p>
                    <h1 style={{ margin: "0 0 12px", fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 600, lineHeight: 1.2 }}>
                        {t.name}
                    </h1>

                    {/* Quick stats + actions in one row */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", marginTop: "12px" }}>
                        <span className="text-xs text-muted-foreground font-mono">
                            {t.bracketType.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground font-mono">{t.mode}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground font-mono">
                            {t.minParticipants}–{t.maxParticipants} participants
                        </span>
                        {t.prizePool && (
                            <>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs font-mono text-green-400">{t.prizePool}</span>
                            </>
                        )}
                        <div style={{ flex: 1 }} />
                        {user ? (
                            <>
                                {t.status === "registration" && (
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        disabled={joinMutation.isPending}
                                        onClick={() => joinMutation.mutate()}
                                        style={{ padding: "8px 20px", fontSize: "12px" }}
                                    >
                                        {joinMutation.isPending ? "Joining…" : "Join lobby"}
                                    </button>
                                )}
                                {t.status !== "draft" && (
                                    <Link
                                        href={`/tournaments/${id}/lobby`}
                                        className="btn btn-secondary"
                                        style={{ padding: "8px 20px", fontSize: "12px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>groups</span>
                                        Lobby
                                    </Link>
                                )}
                            </>
                        ) : (
                            <Link
                                href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                                className="btn btn-primary"
                                style={{ padding: "8px 20px", fontSize: "12px", textDecoration: "none", display: "inline-block" }}
                            >
                                Log in to join
                            </Link>
                        )}
                    </div>
                </div>

                {/* Tab bar */}
                {visibleTabs.length > 1 && (
                    <div className="flex gap-0 border-t border-border/30 px-4">
                        {visibleTabs.map((tab) => (
                            <button
                                key={tab.id}
                                className={cn(
                                    "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px",
                                    activeTab === tab.id
                                        ? "border-primary text-primary"
                                        : "border-transparent text-muted-foreground hover:text-foreground",
                                )}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                                    {tab.icon}
                                </span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Tab content */}
            <div style={{ marginTop: "24px" }}>
                {activeTab === "overview" && (
                    <OverviewContent tournament={t} />
                )}

                {activeTab === "bracket" && (
                    <div>
                        {bracketQuery.isPending && (
                            <div className="text-center py-12 text-muted-foreground text-sm">
                                Loading bracket…
                            </div>
                        )}
                        {bracketQuery.data && (
                            <BracketView data={bracketQuery.data} />
                        )}
                        {bracketQuery.isError && (
                            <div className="text-center py-12 text-muted-foreground text-sm">
                                Could not load bracket.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "matches" && (
                    <MatchesContent bracketData={bracketQuery.data ?? null} />
                )}

                {activeTab === "standings" && (
                    <div className="glass-card p-6">
                        {standingsQuery.isPending && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                Loading standings…
                            </div>
                        )}
                        {standingsQuery.data && detailQuery.data && (
                            <StandingsTable
                                standings={standingsQuery.data}
                                bracketType={detailQuery.data.bracketType as any}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function OverviewContent({ tournament: t }: { tournament: any }) {
    return (
        <div className="space-y-6">
            {t.description && (
                <div className="glass-card p-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                        About
                    </h3>
                    <p
                        style={{
                            fontSize: "14px",
                            lineHeight: 1.7,
                            color: "var(--text-secondary)",
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {t.description}
                    </p>
                </div>
            )}

            <div className="glass-card p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                    Details
                </h3>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                        <dt className="text-muted-foreground text-xs mb-1">Mode</dt>
                        <dd className="font-semibold">{t.mode}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground text-xs mb-1">Bracket</dt>
                        <dd className="font-semibold capitalize">{t.bracketType.replace(/_/g, " ")}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground text-xs mb-1">Team Size</dt>
                        <dd className="font-semibold">
                            {t.minTeamSize === t.maxTeamSize
                                ? t.minTeamSize
                                : `${t.minTeamSize}–${t.maxTeamSize}`}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground text-xs mb-1">Participants</dt>
                        <dd className="font-semibold">{t.minParticipants}–{t.maxParticipants}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground text-xs mb-1">Prize</dt>
                        <dd className="font-semibold text-green-400">{t.prizePool || "—"}</dd>
                    </div>
                    {t.entryFee > 0 && (
                        <div>
                            <dt className="text-muted-foreground text-xs mb-1">Entry Fee</dt>
                            <dd className="font-semibold">{t.entryFee}</dd>
                        </div>
                    )}
                    <div>
                        <dt className="text-muted-foreground text-xs mb-1">Scoring</dt>
                        <dd className="font-semibold capitalize">{t.scoringType?.replace(/_/g, " ") ?? "—"}</dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}

function MatchesContent({ bracketData }: { bracketData: BracketState | null }) {
    const [roundFilter, setRoundFilter] = useState<number | "all">("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    if (!bracketData || bracketData.rounds.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground text-sm">
                No matches available yet.
            </div>
        );
    }

    const allMatches = bracketData.rounds.flatMap((r) =>
        r.matches.map((m) => ({ ...m, roundLabel: r.label, roundNumber: r.number })),
    );

    const filtered = allMatches.filter((m) => {
        if (roundFilter !== "all" && m.roundNumber !== roundFilter) return false;
        if (statusFilter !== "all" && m.status !== statusFilter) return false;
        return true;
    });

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <select
                    className="bg-muted/30 border border-border/30 rounded-md px-3 py-1.5 text-xs text-foreground"
                    value={roundFilter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRoundFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                >
                    <option value="all">All Rounds</option>
                    {bracketData.rounds.map((r) => (
                        <option key={r.number} value={r.number}>{r.label}</option>
                    ))}
                </select>
                <select
                    className="bg-muted/30 border border-border/30 rounded-md px-3 py-1.5 text-xs text-foreground"
                    value={statusFilter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="ongoing">Live</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            {/* Match list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((match) => (
                    <div key={match.id}>
                        <MatchCard
                            match={match}
                            variant="default"
                        />
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    No matches match your filters.
                </div>
            )}
        </div>
    );
}
