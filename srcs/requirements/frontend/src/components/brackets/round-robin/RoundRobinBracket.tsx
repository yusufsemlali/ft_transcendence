"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type {
    BracketViewProps,
    BracketParticipant,
    BracketRound,
    BracketMatch,
} from "../types";

const STATUS_CFG: Record<
    string,
    { label: string; variant: "default" | "outline" | "secondary" | "destructive" | "success" }
> = {
    pending:   { label: "Pending",   variant: "secondary" },
    ongoing:   { label: "Live",      variant: "default" },
    completed: { label: "Done",      variant: "success" },
    disputed:  { label: "Disputed",  variant: "destructive" },
    cancelled: { label: "Cancelled", variant: "outline" },
};

export function RoundRobinBracket({
    data,
    onMatchClick,
    onParticipantClick,
    className,
    compact: _compact,
}: BracketViewProps) {
    const [roundFilter, setRoundFilter] = useState<string>("all");

    const filteredRounds = useMemo(() => {
        if (roundFilter === "all") return data.rounds;
        return data.rounds.filter((r: BracketRound) => r.label === roundFilter);
    }, [data.rounds, roundFilter]);

    const totalMatches = useMemo(
        () => data.rounds.reduce((sum: number, r: BracketRound) => sum + r.matches.length, 0),
        [data.rounds],
    );

    if (data.rounds.length === 0) {
        return (
            <div className={cn("ds-empty-state", className)}>
                No bracket generated yet.
            </div>
        );
    }

    return (
        <div className={cn("bracket-shell", className)} style={{ overflow: "hidden" }}>
            {/* ── Filter bar ── */}
            <div className="glass-card flex items-center gap-2 p-2 px-3" style={{ overflow: "hidden" }}>
                <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: "16px" }}>
                    sports_esports
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 flex-shrink-0">
                    Round
                </span>
                <Select value={roundFilter} onValueChange={setRoundFilter}>
                    <SelectTrigger className="h-7 border-none bg-transparent hover:bg-accent/20 transition-colors focus:ring-0 focus:ring-offset-0 px-2 py-0 text-[11px] font-bold uppercase tracking-tight flex-1 min-w-0">
                        <SelectValue placeholder="All Rounds" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-border/40">
                        <SelectItem value="all" className="text-[11px] font-semibold uppercase">
                            All Rounds ({totalMatches})
                        </SelectItem>
                        {data.rounds.map((r: BracketRound) => (
                            <SelectItem
                                key={r.number}
                                value={r.label}
                                className="text-[11px] font-semibold uppercase"
                            >
                                {r.label} ({r.matches.length})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* ── Match table per round ── */}
            {filteredRounds.map((round: BracketRound) => (
                <div key={round.number} style={{ overflow: "hidden" }}>
                    {/* Round header */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 4px" }}>
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            width: "24px", height: "24px", borderRadius: "6px",
                            background: "color-mix(in srgb, var(--primary) 10%, transparent)",
                            border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)",
                            flexShrink: 0,
                        }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--primary)" }}>
                                {round.number}
                            </span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, lineHeight: 1.2 }}>
                                {round.label}
                            </span>
                            <span style={{ fontSize: "10px", color: "var(--text-muted)", opacity: 0.6 }}>
                                {round.matches.length} match{round.matches.length !== 1 ? "es" : ""}
                            </span>
                        </div>
                        <div style={{ flex: 1, height: "1px", background: "color-mix(in srgb, var(--border-color) 20%, transparent)" }} />
                    </div>

                    {/* Match rows */}
                    <div className="glass-card" style={{ overflow: "hidden" }}>
                        {round.matches.map((match: BracketMatch, idx: number) => (
                            <MatchRow
                                key={match.id}
                                match={match}
                                isLast={idx === round.matches.length - 1}
                                onMatchClick={onMatchClick}
                                onParticipantClick={onParticipantClick}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── Individual match row ── */
function MatchRow({
    match,
    isLast,
    onMatchClick,
    onParticipantClick,
}: {
    match: BracketMatch;
    isLast: boolean;
    onMatchClick?: (match: BracketMatch) => void;
    onParticipantClick?: (participant: BracketParticipant) => void;
}) {
    const status = STATUS_CFG[match.status] ?? STATUS_CFG.pending;
    const p1 = match.participant1;
    const p2 = match.participant2;
    const isCompleted = match.status === "completed";
    const isLive = match.status === "ongoing";
    const p1Winner = match.winnerId != null && match.winnerId === p1?.id;
    const p2Winner = match.winnerId != null && match.winnerId === p2?.id;

    return (
        <div
            style={{
                position: "relative",
                borderBottom: isLast ? "none" : "1px solid color-mix(in srgb, var(--border-color) 20%, transparent)",
                cursor: onMatchClick ? "pointer" : undefined,
                transition: "background 0.15s",
                overflow: "hidden",
            }}
            className={cn(onMatchClick && "hover:bg-accent/10")}
            onClick={() => onMatchClick?.(match)}
        >
            {/* Live indicator */}
            {isLive && (
                <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0,
                    width: "3px", background: "var(--primary)",
                    borderRadius: "0 2px 2px 0",
                }} className="animate-pulse" />
            )}

            {/* 
                Single layout that works at ALL sizes.
                Using a simple 3-column approach: [name] [score] [name]
                with the badge below on its own row.
            */}
            <div style={{ padding: "10px 12px 6px 12px", overflow: "hidden" }}>
                {/* Main row: P1 — Score — P2 */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    width: "100%",
                    overflow: "hidden",
                }}>
                    {/* P1 name */}
                    <div
                        style={{
                            flex: 1,
                            minWidth: 0,
                            overflow: "hidden",
                            cursor: onParticipantClick && p1 ? "pointer" : undefined,
                        }}
                        onClick={(e) => {
                            if (p1 && onParticipantClick) {
                                e.stopPropagation();
                                onParticipantClick(p1);
                            }
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            {p1Winner && (
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: "12px", flexShrink: 0 }}>
                                    emoji_events
                                </span>
                            )}
                            <span style={{
                                fontSize: "12px",
                                fontWeight: isCompleted && p1Winner ? 700 : 600,
                                color: !p1
                                    ? "var(--text-muted)"
                                    : isCompleted && p1Winner
                                        ? "var(--primary)"
                                        : isCompleted && !p1Winner && match.winnerId
                                            ? "color-mix(in srgb, var(--text-muted) 50%, transparent)"
                                            : "var(--text-primary)",
                                fontStyle: !p1 ? "italic" : undefined,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}>
                                {p1?.name ?? "TBD"}
                            </span>
                        </div>
                    </div>

                    {/* Score */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "3px",
                        flexShrink: 0,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: isLive
                            ? "color-mix(in srgb, var(--primary) 8%, transparent)"
                            : "color-mix(in srgb, var(--bg-secondary) 30%, transparent)",
                    }}>
                        <span style={{
                            fontSize: "13px",
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                            width: "16px",
                            textAlign: "right",
                            color: match.status === "pending"
                                ? "color-mix(in srgb, var(--text-muted) 30%, transparent)"
                                : isCompleted && p1Winner ? "var(--primary)" : "var(--text-primary)",
                            fontVariantNumeric: "tabular-nums",
                        }}>
                            {match.status !== "pending" ? match.score1 : "–"}
                        </span>
                        <span style={{
                            fontSize: "9px",
                            color: "color-mix(in srgb, var(--text-muted) 30%, transparent)",
                            fontFamily: "var(--font-mono)",
                        }}>:</span>
                        <span style={{
                            fontSize: "13px",
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                            width: "16px",
                            textAlign: "left",
                            color: match.status === "pending"
                                ? "color-mix(in srgb, var(--text-muted) 30%, transparent)"
                                : isCompleted && p2Winner ? "var(--primary)" : "var(--text-primary)",
                            fontVariantNumeric: "tabular-nums",
                        }}>
                            {match.status !== "pending" ? match.score2 : "–"}
                        </span>
                    </div>

                    {/* P2 name */}
                    <div
                        style={{
                            flex: 1,
                            minWidth: 0,
                            overflow: "hidden",
                            cursor: onParticipantClick && p2 ? "pointer" : undefined,
                        }}
                        onClick={(e) => {
                            if (p2 && onParticipantClick) {
                                e.stopPropagation();
                                onParticipantClick(p2);
                            }
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
                            <span style={{
                                fontSize: "12px",
                                fontWeight: isCompleted && p2Winner ? 700 : 600,
                                color: !p2
                                    ? "var(--text-muted)"
                                    : isCompleted && p2Winner
                                        ? "var(--primary)"
                                        : isCompleted && !p2Winner && match.winnerId
                                            ? "color-mix(in srgb, var(--text-muted) 50%, transparent)"
                                            : "var(--text-primary)",
                                fontStyle: !p2 ? "italic" : undefined,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                textAlign: "right",
                                direction: "rtl",
                            }}>
                                {p2?.name ?? "TBD"}
                            </span>
                            {p2Winner && (
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: "12px", flexShrink: 0 }}>
                                    emoji_events
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status badge row */}
                <div style={{ display: "flex", justifyContent: "center", paddingTop: "4px", paddingBottom: "2px" }}>
                    <Badge variant={status.variant}>
                        {status.label}
                    </Badge>
                </div>
            </div>
        </div>
    );
}
