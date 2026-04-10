"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { MatchCard, RoundHeader, StandingsTable } from "../shared";
import type { BracketViewProps, BracketParticipant } from "../types";

type ViewMode = "matrix" | "rounds";

export function RoundRobinBracket({
    data,
    onMatchClick,
    onParticipantClick,
    renderParticipant,
    className,
    compact,
}: BracketViewProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("rounds");

    const matrixData = useMemo(() => {
        const participants = data.participants.filter((p) => p.status !== "disqualified");
        const pMap = new Map(participants.map((p) => [p.id, p]));

        const matrix = new Map<string, Map<string, { score1: number; score2: number; status: string } | null>>();
        for (const p of participants) {
            const row = new Map<string, { score1: number; score2: number; status: string } | null>();
            for (const q of participants) row.set(q.id, null);
            matrix.set(p.id, row);
        }

        for (const round of data.rounds) {
            for (const match of round.matches) {
                if (!match.participant1 || !match.participant2) continue;
                const p1 = match.participant1.id;
                const p2 = match.participant2.id;
                matrix.get(p1)?.set(p2, { score1: match.score1, score2: match.score2, status: match.status });
                matrix.get(p2)?.set(p1, { score1: match.score2, score2: match.score1, status: match.status });
            }
        }

        return { participants, matrix };
    }, [data]);

    if (data.rounds.length === 0) {
        return (
            <div className={cn("ds-empty-state", className)}>
                No bracket generated yet.
            </div>
        );
    }

    return (
        <div className={cn("bracket-shell", className)}>
            <div className="glass-card bracket-section">
                <h3 className="bracket-section-title">Standings</h3>
                <StandingsTable
                    standings={data.standings}
                    bracketType={data.bracketType}
                    onParticipantClick={onParticipantClick}
                    compact={compact}
                />
            </div>

            <div className="bracket-view-toggle">
                <button
                    className={cn("ds-tab", viewMode === "rounds" && "is-active")}
                    onClick={() => setViewMode("rounds")}
                >
                    <span className="material-symbols-outlined text-sm">view_list</span>
                    Rounds
                </button>
                <button
                    className={cn("ds-tab", viewMode === "matrix" && "is-active")}
                    onClick={() => setViewMode("matrix")}
                >
                    <span className="material-symbols-outlined text-sm">grid_on</span>
                    Matrix
                </button>
            </div>

            {viewMode === "rounds" && (
                <div className="bracket-shell">
                    {data.rounds.map((round) => (
                        <div key={round.number}>
                            <RoundHeader
                                roundNumber={round.number}
                                label={round.label}
                                align="left"
                            />
                            <div className="match-grid match-grid-3col">
                                {round.matches.map((match) => (
                                    <MatchCard
                                        key={match.id}
                                        match={match}
                                        variant={compact ? "compact" : "default"}
                                        onClick={onMatchClick}
                                        onParticipantClick={onParticipantClick}
                                        renderParticipant={renderParticipant}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {viewMode === "matrix" && (
                <div className="glass-card bracket-section overflow-x-auto">
                    <table className="standings-table">
                        <thead>
                            <tr>
                                <th className="standings-th is-left" />
                                {matrixData.participants.map((p) => (
                                    <th key={p.id} className="standings-th" title={p.name}>
                                        <span className="text-[10px]">{p.name.slice(0, 6)}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {matrixData.participants.map((rowP) => (
                                <tr key={rowP.id} className="standings-row">
                                    <td className="standings-td is-left font-medium">{rowP.name}</td>
                                    {matrixData.participants.map((colP) => {
                                        if (rowP.id === colP.id) {
                                            return <td key={colP.id} className="standings-td bg-muted/20">—</td>;
                                        }
                                        const result = matrixData.matrix.get(rowP.id)?.get(colP.id);
                                        if (!result || result.status === "pending") {
                                            return <td key={colP.id} className="standings-td text-muted-foreground">·</td>;
                                        }
                                        const won = result.score1 > result.score2;
                                        const draw = result.score1 === result.score2;
                                        return (
                                            <td
                                                key={colP.id}
                                                className={cn(
                                                    "standings-td",
                                                    won && "text-green-400",
                                                    !won && !draw && "text-red-400",
                                                    draw && "text-muted-foreground",
                                                )}
                                            >
                                                {result.score1}–{result.score2}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
