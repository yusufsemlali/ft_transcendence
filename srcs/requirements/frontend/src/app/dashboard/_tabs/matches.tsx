"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchTournamentDetailThunk, reportScoreThunk, finalizeMatchThunk } from "@/lib/store/tournamentSlice";
import { toast } from "@/components/ui/sonner";
import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
        // We FORCE /bff to use our streaming-enabled proxy fix
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

    const liveMatches = useMemo(() => allMatches.filter((m) => m.status === "ongoing"), [allMatches]);

    const filteredMatches = useMemo(() => {
        switch (filter) {
            case "live":
                return allMatches.filter((m: Row) => m.status === "ongoing");
            case "pending":
                return allMatches.filter((m: Row) => m.status === "pending");
            case "completed":
                return allMatches.filter((m: Row) => m.status === "completed");
            case "issues":
                return allMatches.filter((m: Row) => m.status === "disputed" || m.status === "cancelled");
            default:
                return allMatches;
        }
    }, [allMatches, filter]);

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
            <div className="glass-card flex flex-wrap gap-2 p-3">
                {filters.map((f) => (
                    <button
                        key={f.id}
                        type="button"
                        className={cn(
                            "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
                            filter === f.id
                                ? "border-primary bg-primary/15 text-primary"
                                : "border-border/60 bg-background/40 text-muted-foreground hover:bg-accent/40",
                        )}
                        onClick={() => setFilter(f.id)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Match table */}
            <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[960px] text-sm">
                        <thead>
                            <tr className="border-b border-border/50">
                                <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Round</th>
                                <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Participant 1</th>
                                <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-28">Score</th>
                                <th className="text-right py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Participant 2</th>
                                <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-24">Status</th>
                                <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground min-w-[280px]">Controls</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMatches.map((match: Row) => {
                                const badge = STATUS_BADGE[match.status] ?? STATUS_BADGE.pending;
                                const isEditing = editingMatch === match.id;
                                const p1Name = match.participant1?.name ?? "TBD";
                                const p2Name = match.participant2?.name ?? "TBD";
                                const p1Winner = match.winnerId === match.participant1?.id;
                                const p2Winner = match.winnerId === match.participant2?.id;
                                const canScore =
                                    match.status !== "completed" &&
                                    match.status !== "cancelled" &&
                                    match.participant1 &&
                                    match.participant2;

                                return (
                                    <tr key={match.id} className="border-b border-border/20 hover:bg-accent/20 transition-colors">
                                        <td className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">{match.roundLabel}</td>
                                        <td className={cn("py-2.5 px-4 text-xs", p1Winner && "font-bold text-primary")}>{p1Name}</td>
                                        <td className="py-2.5 px-4 text-center">
                                            {isEditing ? (
                                                <div className="flex items-center justify-center gap-1">
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
                                                </div>
                                            ) : (
                                                <span className="font-mono text-xs">
                                                    {match.score1} – {match.score2}
                                                </span>
                                            )}
                                        </td>
                                        <td className={cn("py-2.5 px-4 text-xs text-right", p2Winner && "font-bold text-primary")}>{p2Name}</td>
                                        <td className="py-2.5 px-4 text-center">
                                            <Badge variant={badge.variant}>{badge.label}</Badge>
                                        </td>
                                        <td className="py-2 px-4">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {canScore && !isEditing && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        style={{ fontSize: "10px", padding: "3px 8px" }}
                                                        onClick={() => {
                                                            setEditingMatch(match.id);
                                                            setScore1(match.score1);
                                                            setScore2(match.score2);
                                                        }}
                                                    >
                                                        Edit scores
                                                    </button>
                                                )}
                                                {canScore && !isEditing && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary"
                                                        style={{ fontSize: "10px", padding: "3px 8px" }}
                                                        onClick={() => handleFinalize(match.id, match.score1, match.score2)}
                                                    >
                                                        Finalize match
                                                    </button>
                                                )}
                                                {isEditing && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="btn btn-secondary"
                                                            style={{ fontSize: "10px", padding: "3px 8px" }}
                                                            onClick={() => handleSaveScores(match.id, score1, score2)}
                                                        >
                                                            Save scores
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary"
                                                            style={{ fontSize: "10px", padding: "3px 8px" }}
                                                            onClick={() => handleFinalize(match.id, score1, score2)}
                                                        >
                                                            Finalize match
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-secondary"
                                                            style={{ fontSize: "10px", padding: "3px 8px" }}
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
                                                        style={{ fontSize: "10px", padding: "3px 8px" }}
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
                                                        style={{ fontSize: "10px", padding: "3px 8px" }}
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
                                                        style={{ fontSize: "10px", padding: "3px 8px" }}
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
                                                        Cancel match
                                                    </button>
                                                )}
                                                {match.status === "disputed" ? (
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        style={{ fontSize: "10px", padding: "3px 8px" }}
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
                                                            style={{ fontSize: "10px", padding: "3px 8px" }}
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
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
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
                {canScore && !isEditing && (
                    <>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: "10px", padding: "4px 10px" }}
                            onClick={() => {
                                setEditingMatch(match.id);
                                setScore1(match.score1);
                                setScore2(match.score2);
                            }}
                        >
                            Edit scores
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            style={{ fontSize: "10px", padding: "4px 10px" }}
                            onClick={() => handleFinalize(match.id, match.score1, match.score2)}
                        >
                            Finalize match
                        </button>
                    </>
                )}
                {isEditing && canScore && (
                    <>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: "10px", padding: "4px 10px" }}
                            onClick={() => handleSaveScores(match.id, score1, score2)}
                        >
                            Save scores
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            style={{ fontSize: "10px", padding: "4px 10px" }}
                            onClick={() => handleFinalize(match.id, score1, score2)}
                        >
                            Finalize match
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: "10px", padding: "4px 10px" }}
                            onClick={() => setEditingMatch(null)}
                        >
                            Close
                        </button>
                    </>
                )}
                <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "10px", padding: "4px 10px" }}
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
                <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "10px", padding: "4px 10px" }}
                    disabled={patchMutation.isPending}
                    onClick={() =>
                        patchMutation.mutate({
                            matchId: match.id,
                            body: { status: "disputed" },
                        })
                    }
                >
                    Flag dispute
                </button>
            </div>
        </div>
    );
}
