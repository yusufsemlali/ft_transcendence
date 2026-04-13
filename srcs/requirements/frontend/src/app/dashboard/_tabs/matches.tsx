"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchTournamentDetailThunk, reportScoreThunk, finalizeMatchThunk } from "@/lib/store/tournamentSlice";
import { toast } from "@/components/ui/sonner";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BracketRound, BracketMatch, Tournament, Organization } from "@ft-transcendence/contracts";

interface MatchesTabProps {
    tournament: Tournament;
    org: Organization;
}

type Filter = "all" | "live" | "pending" | "completed" | "issues";

type Row = BracketMatch & { roundLabel: string };

export function MatchesTab({ tournament }: MatchesTabProps) {
    const dispatch = useAppDispatch();
    const detailState = useAppSelector(s => s.tournament.details[tournament.id]);
    const bracketData = detailState?.bracket;

    const [editingMatch, setEditingMatch] = useState<string | null>(null);
    const [score1, setScore1] = useState(0);
    const [score2, setScore2] = useState(0);
    const [filter, setFilter] = useState<Filter>("all");
    const [roundFilter, setRoundFilter] = useState<string>("all");

    const fetchDetail = useCallback(() => {
        dispatch(fetchTournamentDetailThunk(tournament.id));
    }, [dispatch, tournament.id]);

    useEffect(() => {
        if (!detailState) {
            fetchDetail();
        }
    }, [detailState, fetchDetail]);

    /* ── Real-time Hydration (SSE) ── */
    useEffect(() => {
        const streamUrl = "/bff/tournaments/" + tournament.id + "/lobby/stream";
        const eventSource = new EventSource(streamUrl, { withCredentials: true });

        eventSource.addEventListener("lobby_changed", () => {
             fetchDetail();
        });

        return () => {
            eventSource.close();
        };
    }, [tournament.id, fetchDetail]);

    const handleSaveScores = async (matchId: string, s1: number, s2: number) => {
        try {
            await dispatch(reportScoreThunk({ matchId, tournamentId: tournament.id, s1, s2 })).unwrap();
            toast.success("Scores saved");
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed to save scores");
        }
    };

    const handleFinalize = async (matchId: string, s1: number, s2: number) => {
        try {
            await dispatch(finalizeMatchThunk({ matchId, tournamentId: tournament.id, s1, s2 })).unwrap();
            toast.success("Match finalized");
            setEditingMatch(null);
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed to finalize match");
        }
    };

    const patchMutation = useMutation({
        mutationFn: async ({
            matchId,
            body,
        }: { matchId: string; body: Record<string, unknown> }) => {
            const res = await api.matches.updateMatch({
                params: { id: matchId },
                body: body,
            });
            if (res.status !== 200) {
                const body = res.body as { message?: string };
                throw new Error(body?.message ?? "Failed to update match");
            }
            return res.body;
        },
        onSuccess: (
            _: unknown,
            variables: { matchId: string; body: { status?: string } },
        ) => {
            const st = variables.body?.status;
            const label =
                st === "ongoing"
                    ? "Match marked live"
                    : st === "pending"
                      ? "Match updated"
                      : st === "cancelled"
                        ? "Match cancelled"
                        : st === "disputed"
                          ? "Match flagged disputed"
                          : "Match updated";
            toast.success(label);
            fetchDetail();
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const allMatches: Row[] = useMemo(
        () =>
            bracketData?.rounds.flatMap((r: BracketRound) =>
                r.matches.map((m: BracketMatch) => ({ ...m, roundLabel: r.label })),
            ) ?? [],
        [bracketData],
    );

    const rounds = useMemo(() => {
        if (!bracketData) return [];
        return Array.from(new Set(bracketData.rounds.map((r: BracketRound) => r.label)));
    }, [bracketData]);

    const liveMatches = useMemo(() => allMatches.filter((m) => m.status === "ongoing"), [allMatches]);

    const filteredMatches = useMemo(() => {
        let matches = allMatches;

        if (filter !== "all") {
            switch (filter) {
                case "live":
                    matches = matches.filter((m: Row) => m.status === "ongoing");
                    break;
                case "pending":
                    matches = matches.filter((m: Row) => m.status === "pending");
                    break;
                case "completed":
                    matches = matches.filter((m: Row) => m.status === "completed");
                    break;
                case "issues":
                    matches = matches.filter((m: Row) => m.status === "disputed" || m.status === "cancelled");
                    break;
            }
        }

        if (roundFilter !== "all") {
            matches = matches.filter(m => m.roundLabel === roundFilter);
        }

        return matches;
    }, [allMatches, filter, roundFilter]);

    if (detailState?.isLoading && !bracketData) {
        return (
            <div className="glass-card" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                Loading matches…
            </div>
        );
    }

    if (allMatches.length === 0) {
        return (
            <div className="glass-card" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "40px", opacity: 0.3 }}>scoreboard</span>
                <p style={{ marginTop: "12px" }}>No matches yet. Generate the bracket first.</p>
            </div>
        );
    }

    const STATUS_BADGE: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" | "success" }> = {
        pending: { label: "Pending", variant: "secondary" },
        ongoing: { label: "Live", variant: "default" },
        completed: { label: "Done", variant: "success" },
        disputed: { label: "Disputed", variant: "destructive" },
        cancelled: { label: "Cancelled", variant: "outline" },
    };

    const filters: { id: Filter; label: string }[] = [
        { id: "all", label: "All" },
        { id: "live", label: `Live (${liveMatches.length})` },
        { id: "pending", label: "Pending" },
        { id: "completed", label: "Completed" },
        { id: "issues", label: "Issues" },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Live focus */}
            {liveMatches.length > 0 && (
                <div className="glass-card border-primary/25" style={{ padding: "16px", background: "color-mix(in srgb, var(--primary) 6%, transparent)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: "22px" }}>podcasts</span>
                        <span style={{ fontSize: "14px", fontWeight: 700 }}>Live now</span>
                        <span className="ml-1 inline-flex h-2 w-2 animate-pulse rounded-full bg-primary" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        {liveMatches.map((match: Row) => (
                            <LiveMatchCard
                                key={match.id}
                                match={match}
                                statusBadge={STATUS_BADGE[match.status] ?? STATUS_BADGE.pending}
                                patchMutation={patchMutation}
                                handleSaveScores={handleSaveScores}
                                handleFinalize={handleFinalize}
                                editingMatch={editingMatch}
                                setEditingMatch={setEditingMatch}
                                score1={score1}
                                score2={score2}
                                setScore1={setScore1}
                                setScore2={setScore2}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="glass-card flex-1 flex items-center gap-3 p-2 px-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Status</span>
                    <div className="h-4 w-px bg-border/40 mx-1 hidden sm:block" />
                    <div className="flex-1 flex flex-wrap gap-1">
                        {filters.map((f) => (
                            <button
                                key={f.id}
                                type="button"
                                className={cn(
                                    "rounded px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-all",
                                    filter === f.id
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                                )}
                                onClick={() => setFilter(f.id)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Integrated Refresh Button */}
                    <div className="h-4 w-px bg-border/40 mx-1" />
                    <button
                        type="button"
                        onClick={fetchDetail}
                        disabled={detailState?.isLoading}
                        title="Refresh data"
                        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-accent/40 transition-all active:scale-90 disabled:opacity-50"
                    >
                        <span className={cn(
                            "material-symbols-outlined text-[18px] text-muted-foreground",
                            detailState?.isLoading && "animate-spin text-primary"
                        )}>
                            refresh
                        </span>
                    </button>
                </div>

                <div className="glass-card flex items-center gap-3 p-2 px-3 min-w-[200px]">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Round</span>
                    <div className="h-4 w-px bg-border/40 mx-1" />
                    <Select value={roundFilter} onValueChange={setRoundFilter}>
                        <SelectTrigger className="h-8 border-none bg-transparent hover:bg-accent/20 transition-colors focus:ring-0 focus:ring-offset-0 px-2 py-0 text-[11px] font-bold uppercase tracking-tight">
                            <SelectValue placeholder="All Rounds" />
                        </SelectTrigger>
                        <SelectContent className="glass-card border-border/40">
                            <SelectItem value="all" className="text-[11px] font-semibold uppercase">All Rounds ({allMatches.length})</SelectItem>
                            {rounds.map((r: string) => {
                                const count = allMatches.filter(m => m.roundLabel === r).length;
                                return (
                                    <SelectItem key={r} value={r} className="text-[11px] font-semibold uppercase">
                                        {r} ({count})
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Match list */}
            <div className="flex flex-col gap-3">
                {/* Desktop Header (hidden on mobile) */}
                <div className="hidden lg:grid lg:grid-cols-[1fr_2fr_100px_2fr_100px_1fr] gap-4 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50">
                    <div>Round</div>
                    <div>Participant 1</div>
                    <div className="text-center">Score</div>
                    <div className="text-right">Participant 2</div>
                    <div className="text-center">Status</div>
                    <div className="text-right">Controls</div>
                </div>

                {filteredMatches.map((m: Row) => (
                    <MatchRow 
                        key={m.id} 
                        match={m} 
                        statusBadge={STATUS_BADGE[m.status] ?? STATUS_BADGE.pending}
                        editingMatch={editingMatch}
                        setEditingMatch={setEditingMatch}
                        score1={score1}
                        score2={score2}
                        setScore1={setScore1}
                        setScore2={setScore2}
                        handleSaveScores={handleSaveScores}
                        handleFinalize={handleFinalize}
                        patchMutation={patchMutation}
                    />
                ))}
            </div>
        </div>
    );
}

function MatchRow({
    match,
    statusBadge,
    editingMatch,
    setEditingMatch,
    score1,
    score2,
    setScore1,
    setScore2,
    handleSaveScores,
    handleFinalize,
    patchMutation
}: {
    match: Row;
    statusBadge: { label: string; variant: "default" | "outline" | "secondary" | "destructive" | "success" };
    editingMatch: string | null;
    setEditingMatch: (id: string | null) => void;
    score1: number;
    score2: number;
    setScore1: (n: number) => void;
    setScore2: (n: number) => void;
    handleSaveScores: (id: string, s1: number, s2: number) => void;
    handleFinalize: (id: string, s1: number, s2: number) => void;
    patchMutation: { isPending: boolean; mutate: (args: { matchId: string; body: Record<string, unknown> }) => void };
}) {
    const isEditing = editingMatch === match.id;
    const p1Name = match.participant1?.name ?? "TBD";
    const p2Name = match.participant2?.name ?? "TBD";
    const p1Winner = match.winnerId === match.participant1?.id;
    const p2Winner = match.winnerId === match.participant2?.id;
    const canScore = match.status !== "completed" && match.status !== "cancelled" && match.participant1 && match.participant2;

    return (
        <div className={cn(
            "glass-card transition-all duration-200 hover:border-primary/30 overflow-hidden",
            isEditing ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "p-0"
        )}>
            {/* Mobile View - Forced hidden on desktop to prevent double-rendering */}
            <div className="flex flex-col gap-4 p-4 lg:!hidden">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground opacity-80">{match.roundLabel}</span>
                    <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className={cn("text-xs truncate", p1Winner && "font-bold text-primary")}>{p1Name}</div>
                    <div className="flex flex-col items-center gap-1">
                        {isEditing ? (
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    min={0}
                                    value={score1}
                                    onChange={(e) => setScore1(Number(e.target.value))}
                                    className="w-10 h-8 text-center bg-muted/50 border border-border/50 rounded px-1 py-0.5 text-xs font-mono"
                                />
                                <span className="text-muted-foreground text-xs">–</span>
                                <input
                                    type="number"
                                    min={0}
                                    value={score2}
                                    onChange={(e) => setScore2(Number(e.target.value))}
                                    className="w-10 h-8 text-center bg-muted/50 border border-border/50 rounded px-1 py-0.5 text-xs font-mono"
                                />
                            </div>
                        ) : (
                            <span className="font-mono text-sm font-bold tracking-tighter">
                                {match.score1} <span className="text-muted-foreground opacity-40 mx-0.5">–</span> {match.score2}
                            </span>
                        )}
                    </div>
                    <div className={cn("text-xs text-right truncate", p2Winner && "font-bold text-primary")}>{p2Name}</div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/10">
                    <MatchControls 
                        match={match}
                        isEditing={isEditing}
                        canScore={canScore ? true : false}
                        score1={score1}
                        score2={score2}
                        setEditingMatch={setEditingMatch}
                        handleSaveScores={handleSaveScores}
                        handleFinalize={handleFinalize}
                        patchMutation={patchMutation}
                        compact
                    />
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden lg:grid grid-cols-[1fr_2fr_100px_2fr_100px_1fr] gap-4 items-center px-6 py-4">
                <div className="text-xs text-muted-foreground">{match.roundLabel}</div>
                <div className={cn("text-sm truncate", p1Winner && "font-bold text-primary")}>{p1Name}</div>
                <div className="flex items-center justify-center gap-1">
                    {isEditing ? (
                        <>
                            <input
                                type="number"
                                min={0}
                                value={score1}
                                onChange={(e) => setScore1(Number(e.target.value))}
                                className="w-11 text-center bg-muted/50 border border-border/50 rounded px-1 py-0.5 text-xs font-mono"
                            />
                            <span className="text-muted-foreground text-xs">–</span>
                            <input
                                type="number"
                                min={0}
                                value={score2}
                                onChange={(e) => setScore2(Number(e.target.value))}
                                className="w-11 text-center bg-muted/50 border border-border/50 rounded px-1 py-0.5 text-xs font-mono"
                            />
                        </>
                    ) : (
                        <span className="font-mono text-sm">
                            {match.score1} – {match.score2}
                        </span>
                    )}
                </div>
                <div className={cn("text-sm text-right truncate", p2Winner && "font-bold text-primary")}>{p2Name}</div>
                <div className="flex justify-center">
                    <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                </div>
                <div className="flex justify-end gap-1.5">
                    <MatchControls 
                        match={match}
                        isEditing={isEditing}
                        canScore={canScore ? true : false}
                        score1={score1}
                        score2={score2}
                        setEditingMatch={setEditingMatch}
                        handleSaveScores={handleSaveScores}
                        handleFinalize={handleFinalize}
                        patchMutation={patchMutation}
                    />
                </div>
            </div>
        </div>
    );
}

function MatchControls({
    match,
    isEditing,
    canScore,
    score1,
    score2,
    setEditingMatch,
    handleSaveScores,
    handleFinalize,
    patchMutation,
    compact = false
}: {
    match: Row;
    isEditing: boolean;
    canScore: boolean;
    score1: number;
    score2: number;
    setEditingMatch: (id: string | null) => void;
    handleSaveScores: (id: string, s1: number, s2: number) => void;
    handleFinalize: (id: string, s1: number, s2: number) => void;
    patchMutation: { isPending: boolean; mutate: (args: { matchId: string; body: Record<string, unknown> }) => void };
    compact?: boolean;
}) {
    return (
        <div className="flex flex-wrap gap-1.5">
            {canScore && !isEditing && (
                <>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: "10px", padding: compact ? "4px 8px" : "6px 12px" }}
                        onClick={() => {
                            setEditingMatch(match.id);
                        }}
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        style={{ fontSize: "10px", padding: compact ? "4px 8px" : "6px 12px" }}
                        onClick={() => handleFinalize(match.id, match.score1, match.score2)}
                    >
                        Finalize
                    </button>
                </>
            )}
            {isEditing && (
                <>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: "10px", padding: compact ? "4px 8px" : "6px 12px" }}
                        onClick={() => handleSaveScores(match.id, score1, score2)}
                    >
                        Save
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        style={{ fontSize: "10px", padding: compact ? "4px 8px" : "6px 12px" }}
                        onClick={() => handleFinalize(match.id, score1, score2)}
                    >
                        Finalize
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: "10px", padding: compact ? "4px 8px" : "6px 12px" }}
                        onClick={() => setEditingMatch(null)}
                    >
                        Cancel
                    </button>
                </>
            )}
            {match.status === "pending" && match.participant1 && match.participant2 && (
                <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "10px", padding: compact ? "4px 8px" : "6px 12px" }}
                    disabled={patchMutation.isPending}
                    onClick={() =>
                        patchMutation.mutate({
                            matchId: match.id,
                            body: { status: "ongoing" },
                        })
                    }
                >
                    Go live
                </button>
            )}
            {match.status === "ongoing" && (
                <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "10px", padding: compact ? "4px 8px" : "6px 12px" }}
                    disabled={patchMutation.isPending}
                    onClick={() =>
                        patchMutation.mutate({
                            matchId: match.id,
                            body: { status: "pending" },
                        })
                    }
                >
                    Pause
                </button>
            )}
            {(match.status === "pending" || match.status === "ongoing") && (
                <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "10px", padding: compact ? "4px 8px" : "6px 12px" }}
                    disabled={patchMutation.isPending}
                    onClick={() => {
                        if (confirm("Cancel this match?")) {
                            patchMutation.mutate({
                                matchId: match.id,
                                body: { status: "cancelled" },
                            });
                        }
                    }}
                >
                    Cancel
                </button>
            )}
            {match.status === "disputed" ? (
                <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "10px", padding: compact ? "4px 8px" : "6px 12px" }}
                    disabled={patchMutation.isPending}
                    onClick={() =>
                        patchMutation.mutate({
                            matchId: match.id,
                            body: { status: "pending" },
                        })
                    }
                >
                    Clear dispute
                </button>
            ) : (
                match.status !== "cancelled" && (
                    <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: "10px", padding: compact ? "4px 8px" : "6px 12px" }}
                        disabled={patchMutation.isPending}
                        onClick={() =>
                            patchMutation.mutate({
                                matchId: match.id,
                                body: { status: "disputed" },
                            })
                        }
                    >
                        Dispute
                    </button>
                )
            )}
        </div>
    );
}

type PatchFn = (args: {
    matchId: string;
    body: { status?: "pending" | "ongoing" | "cancelled" | "disputed" };
}) => void;

function LiveMatchCard({
    match,
    statusBadge,
    patchMutation,
    handleSaveScores,
    handleFinalize,
    editingMatch,
    setEditingMatch,
    score1,
    score2,
    setScore1,
    setScore2,
}: {
    match: Row;
    statusBadge: { label: string; variant: "default" | "outline" | "secondary" | "destructive" | "success" };
    patchMutation: { isPending: boolean; mutate: PatchFn };
    handleSaveScores: (matchId: string, s1: number, s2: number) => void;
    handleFinalize: (matchId: string, s1: number, s2: number) => void;
    editingMatch: string | null;
    setEditingMatch: (id: string | null) => void;
    score1: number;
    score2: number;
    setScore1: (n: number) => void;
    setScore2: (n: number) => void;
}) {
    const isEditing = editingMatch === match.id;
    const p1 = match.participant1?.name ?? "TBD";
    const p2 = match.participant2?.name ?? "TBD";
    const canScore = match.participant1 && match.participant2;

    return (
        <div
            className="rounded-lg border border-border/50 bg-background/50 p-3"
            style={{ boxShadow: "0 0 0 1px color-mix(in srgb, var(--primary) 20%, transparent)" }}
        >
            <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{match.roundLabel}</span>
                <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            </div>
            <div className="mb-3 text-sm font-semibold">
                <span className="text-primary">{p1}</span>
                <span className="mx-1.5 text-muted-foreground font-normal">vs</span>
                <span className="text-primary">{p2}</span>
            </div>
            {isEditing && canScore ? (
                <div className="mb-2 flex items-center gap-2">
                    <input
                        type="number"
                        min={0}
                        className="w-14 rounded border border-border/60 bg-background px-2 py-1 text-center font-mono text-sm"
                        value={score1}
                        onChange={(e) => setScore1(Number(e.target.value))}
                    />
                    <span className="text-muted-foreground">–</span>
                    <input
                        type="number"
                        min={0}
                        className="w-14 rounded border border-border/60 bg-background px-2 py-1 text-center font-mono text-sm"
                        value={score2}
                        onChange={(e) => setScore2(Number(e.target.value))}
                    />
                </div>
            ) : (
                <div className="mb-2 font-mono text-lg">
                    {match.score1} <span className="text-muted-foreground">–</span> {match.score2}
                </div>
            )}
            <div className="flex flex-wrap gap-1.5">
                <MatchControls 
                    match={match}
                    isEditing={isEditing}
                    canScore={canScore ? true : false}
                    score1={score1}
                    score2={score2}
                    setEditingMatch={setEditingMatch}
                    handleSaveScores={handleSaveScores}
                    handleFinalize={handleFinalize}
                    patchMutation={patchMutation}
                    compact
                />
            </div>
        </div>
    );
}
