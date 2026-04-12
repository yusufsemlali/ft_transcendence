"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api/api";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import type { BracketState, BracketMatch, BracketRound } from "@ft-transcendence/contracts";
import type { Tournament, Organization } from "@ft-transcendence/contracts";

interface ScheduleTabProps {
    tournament: Tournament;
    org: Organization;
}

function toDatetimeLocalValue(d: Date | string | null | undefined): string {
    if (!d) return "";
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocalValue(v: string): Date | null {
    if (!v.trim()) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
}

type Row = BracketMatch & { roundLabel: string };

export function ScheduleTab({ tournament }: ScheduleTabProps) {
    const queryClient = useQueryClient();

    const bracketQuery = useQuery<BracketState>({
        queryKey: ["bracket-state", tournament.id],
        queryFn: async () => {
            const res = await api.matches.getBracketState({
                params: { tournamentId: tournament.id },
            });
            if (res.status !== 200) throw new Error("Failed to load bracket");
            return res.body as BracketState;
        },
    });

    const [drafts, setDrafts] = useState<Record<string, string>>({});

    const updateMutation = useMutation({
        mutationFn: async ({ matchId, scheduledAt }: { matchId: string; scheduledAt: Date | null }) => {
            const res = await api.matches.updateMatch({
                params: { id: matchId },
                body: { scheduledAt },
            });
            if (res.status !== 200) {
                const body = res.body as { message?: string };
                throw new Error(body?.message ?? "Failed to update schedule");
            }
            return res.body;
        },
        onSuccess: () => {
            toast.success("Schedule updated");
            queryClient.invalidateQueries({ queryKey: ["bracket-state", tournament.id] });
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const rows: Row[] = useMemo(
        () =>
            bracketQuery.data?.rounds.flatMap((r: BracketRound) =>
                r.matches.map((m: BracketMatch) => ({ ...m, roundLabel: r.label })),
            ) ?? [],
        [bracketQuery.data],
    );

    const sortedRows = useMemo(() => {
        const list = [...rows];
        list.sort((a, b) => {
            const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Infinity;
            const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Infinity;
            if (ta !== tb) return ta - tb;
            return a.roundLabel.localeCompare(b.roundLabel) || a.position - b.position;
        });
        return list;
    }, [rows]);

    if (bracketQuery.isPending) {
        return (
            <div className="glass-card" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                Loading schedule…
            </div>
        );
    }

    if (!bracketQuery.data || rows.length === 0) {
        return (
            <div className="glass-card" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "40px", opacity: 0.3 }}>calendar_month</span>
                <p style={{ marginTop: "12px" }}>No schedule available. Generate the bracket first.</p>
            </div>
        );
    }

    const STATUS_BADGE: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" | "success" }> = {
        pending: { label: "Scheduled", variant: "secondary" },
        ongoing: { label: "In Progress", variant: "default" },
        completed: { label: "Completed", variant: "success" },
        disputed: { label: "Disputed", variant: "destructive" },
        cancelled: { label: "Cancelled", variant: "outline" },
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="glass-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>calendar_month</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>Match schedule</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                        Set when each match should start. Unscheduled matches sort to the bottom. Times are stored in UTC and shown in your local timezone.
                    </div>
                </div>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-sm">
                        <thead>
                            <tr className="border-b border-border/50">
                                <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Round</th>
                                <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Matchup</th>
                                <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-56">Start time</th>
                                <th className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-24">Status</th>
                                <th className="text-right py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedRows.map((match: Row) => {
                                const badge = STATUS_BADGE[match.status] ?? STATUS_BADGE.pending;
                                const draft = drafts[match.id] ?? toDatetimeLocalValue(match.scheduledAt ?? undefined);
                                return (
                                    <tr key={match.id} className="border-b border-border/20 hover:bg-accent/15 transition-colors">
                                        <td className="py-2.5 px-4 text-xs text-muted-foreground whitespace-nowrap">{match.roundLabel}</td>
                                        <td className="py-2.5 px-4 text-xs">
                                            <span className="font-medium">{match.participant1?.name ?? "TBD"}</span>
                                            <span className="text-muted-foreground mx-1.5">vs</span>
                                            <span className="font-medium">{match.participant2?.name ?? "TBD"}</span>
                                        </td>
                                        <td className="py-2 px-4">
                                            <input
                                                type="datetime-local"
                                                value={draft}
                                                onChange={(e) =>
                                                    setDrafts((d: Record<string, string>) => ({ ...d, [match.id]: e.target.value }))
                                                }
                                                className="w-full max-w-[220px] rounded-md border border-border/60 bg-background/60 px-2 py-1.5 text-xs font-mono"
                                            />
                                        </td>
                                        <td className="py-2.5 px-4 text-center">
                                            <Badge variant={badge.variant}>{badge.label}</Badge>
                                        </td>
                                        <td className="py-2.5 px-4 text-right">
                                            <div className="flex justify-end gap-1.5 flex-wrap">
                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                    style={{ fontSize: "10px", padding: "4px 10px" }}
                                                    disabled={updateMutation.isPending}
                                                    onClick={() => {
                                                        const next = fromDatetimeLocalValue(draft);
                                                        updateMutation.mutate({ matchId: match.id, scheduledAt: next });
                                                    }}
                                                >
                                                    Apply
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    style={{ fontSize: "10px", padding: "4px 10px" }}
                                                    disabled={updateMutation.isPending || !match.scheduledAt}
                                                    onClick={() => {
                                                        setDrafts((d: Record<string, string>) => ({ ...d, [match.id]: "" }));
                                                        updateMutation.mutate({ matchId: match.id, scheduledAt: null });
                                                    }}
                                                >
                                                    Clear
                                                </button>
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
