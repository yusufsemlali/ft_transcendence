"use client";

import React, { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import api from "@/lib/api/api";
import { toast } from "@/components/ui/sonner";
import { BracketView } from "@/components/brackets";
import type { BracketState } from "@ft-transcendence/contracts";
import type { Tournament, Organization } from "@ft-transcendence/contracts";
import { CompetitorSeedBoard } from "../_components/competitor-seed-board";

interface BracketsTabProps {
    tournament: Tournament;
    org: Organization;
}

interface LobbyCompetitor {
    id: string;
    name: string;
    status: string;
    seed?: number | null;
}

interface LobbyState {
    competitors: LobbyCompetitor[];
}

export function BracketsTab({ tournament }: BracketsTabProps) {
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

    const lobbyQuery = useQuery({
        queryKey: ["lobby-state", tournament.id],
        queryFn: async () => {
            const res = await api.tournaments.getLobbyState({
                params: { id: tournament.id },
            });
            if (res.status !== 200) throw new Error("Failed to load lobby");
            return res.body;
        },
    });

    const [seedOrder, setSeedOrder] = useState<string[]>([]);

    useEffect(() => {
        if (!lobbyQuery.data) return;
        const state = lobbyQuery.data as LobbyState;
        const ready = (state.competitors || []).filter((c) => c.status === "ready");
        
        if (ready.length === 0) {
            queueMicrotask(() => setSeedOrder((current) => current.length === 0 ? current : []));
            return;
        }

        const readySet = new Set(ready.map((c) => c.id));
        
        queueMicrotask(() => {
            setSeedOrder((prev: string[]) => {
                let next: string[];
                if (prev.length === 0) {
                    const sorted = [...ready].sort((a, b) => {
                        const sa = a.seed ?? 999999;
                        const sb = b.seed ?? 999999;
                        if (sa !== sb) return sa - sb;
                        return a.name.localeCompare(b.name);
                    });
                    next = sorted.map((c) => c.id);
                } else {
                    const kept = prev.filter((id: string) => readySet.has(id));
                    for (const c of ready) {
                        if (!kept.includes(c.id)) kept.push(c.id);
                    }
                    next = kept;
                }

                // Only update if the order actually changed to prevent cascading renders
                if (next.length === prev.length && next.every((id: string, i: number) => id === prev[i])) {
                    return prev;
                }
                return next;
            });
        });
    }, [lobbyQuery.data]);

    const seedMutation = useMutation({
        mutationFn: async (order: string[]) => {
            const res = await api.tournaments.setCompetitorSeeds({
                params: { id: tournament.id },
                body: { order },
            });
            if (res.status !== 200) {
                const body = res.body as { message?: string };
                throw new Error(body?.message ?? "Failed to save seed order");
            }
            return res.body;
        },
        onSuccess: () => {
            toast.success("Seeding order saved");
            queryClient.invalidateQueries({ queryKey: ["lobby-state", tournament.id] });
        },
        onError: (e: Error) => toast.error(e.message),
    });


    const generateMutation = useMutation({
        mutationFn: async () => {
            const res = await api.matches.generateBracket({
                params: { tournamentId: tournament.id },
                body: {},
            });
            if (res.status !== 201) {
                const body = res.body as { message?: string };
                throw new Error(body?.message ?? "Failed to generate bracket");
            }
            return res.body;
        },
        onSuccess: () => {
            toast.success("Bracket generated successfully");
            queryClient.invalidateQueries({ queryKey: ["bracket-state", tournament.id] });
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const resetMutation = useMutation({
        mutationFn: async () => {
            const res = await api.matches.resetBracket({
                params: { tournamentId: tournament.id },
            });
            if (res.status !== 200) {
                const body = res.body as { message?: string };
                throw new Error(body?.message ?? "Failed to reset bracket");
            }
            return res.body;
        },
        onSuccess: () => {
            toast.success("Bracket reset");
            queryClient.invalidateQueries({ queryKey: ["bracket-state", tournament.id] });
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const hasMatches = Boolean(bracketQuery.data && bracketQuery.data.rounds.length > 0);
    const canGenerate = tournament.status === "upcoming" || tournament.status === "ongoing";
    const canReset = tournament.status !== "completed" && hasMatches;

    const labelMap = useMemo(() => {
        const m = new Map<string, string>();
        const state = lobbyQuery.data as LobbyState | undefined;
        for (const c of (state?.competitors ?? [])) {
            m.set(c.id, c.name);
        }
        return m;
    }, [lobbyQuery.data]);

    const seedingLocked = Boolean(hasMatches);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Admin toolbar */}
            <div className="glass-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>account_tree</span>
                <span style={{ fontSize: "13px", fontWeight: 600, flex: 1 }}>Bracket Management</span>

                {canGenerate && !hasMatches && (
                    <button
                        className="btn btn-primary"
                        style={{ fontSize: "11px", padding: "6px 16px" }}
                        disabled={generateMutation.isPending}
                        onClick={() => generateMutation.mutate()}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>auto_fix_high</span>
                        {generateMutation.isPending ? "Generating…" : "Generate Bracket"}
                    </button>
                )}


                {canReset && (
                    <button
                        className="btn btn-secondary"
                        style={{ fontSize: "11px", padding: "6px 16px", color: "var(--destructive-foreground)" }}
                        disabled={resetMutation.isPending}
                        onClick={() => {
                            if (confirm("This will delete all matches. Continue?")) {
                                resetMutation.mutate();
                            }
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>restart_alt</span>
                        {resetMutation.isPending ? "Resetting…" : "Reset"}
                    </button>
                )}

                {!canGenerate && !hasMatches && (
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Move tournament to &quot;upcoming&quot; or &quot;ongoing&quot; to generate the bracket.
                    </span>
                )}
            </div>

            {/* Manual seeding — before bracket exists */}
            <div className="glass-card" style={{ padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: "20px" }}>format_list_numbered</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>Manual seeding</h3>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.45 }}>
                            Drag competitors to set bracket order (1 = top seed). Applies when you generate the bracket.
                            {seedingLocked && (
                                <>
                                    {" "}
                                    <strong className="text-foreground">Seeding is locked</strong> while matches exist — reset the
                                    bracket to change seeds.
                                </>
                            )}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="btn btn-primary"
                        style={{ fontSize: "11px", padding: "6px 16px" }}
                        disabled={seedingLocked || seedMutation.isPending || seedOrder.length === 0 || lobbyQuery.isPending}
                        onClick={() => seedMutation.mutate(seedOrder)}
                    >
                        {seedMutation.isPending ? "Saving…" : "Save seed order"}
                    </button>
                </div>
                {lobbyQuery.isPending ? (
                    <p className="text-xs text-muted-foreground">Loading lobby…</p>
                ) : (
                    <CompetitorSeedBoard
                        order={seedOrder}
                        getLabel={(id: string) => labelMap.get(id) ?? id.slice(0, 8)}
                        disabled={seedingLocked || seedMutation.isPending}
                        onOrderChange={setSeedOrder}
                    />
                )}
            </div>

            {/* Bracket view */}
            {bracketQuery.isPending && (
                <div className="glass-card" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                    Loading bracket…
                </div>
            )}

            {bracketQuery.data && (
                <BracketView data={bracketQuery.data} />
            )}

            {bracketQuery.isError && !bracketQuery.data && (
                <div className="glass-card" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                    Could not load bracket data.
                </div>
            )}
        </div>
    );
}
