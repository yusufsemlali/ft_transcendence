"use client";

import { cn } from "@/lib/utils";
import type { StandingsTableProps } from "../types";

export function StandingsTable({
    standings,
    bracketType,
    onParticipantClick,
    className,
    compact = false,
}: StandingsTableProps) {
    const showGoals = bracketType === "round_robin";
    const showDraws = bracketType === "round_robin";

    if (standings.length === 0) {
        return (
            <div className={cn("ds-empty-state", className)}>
                No standings available yet.
            </div>
        );
    }

    return (
        <div className={cn("overflow-x-auto", className)}>
            <table className="standings-table">
                <thead>
                    <tr className="border-b border-border/50">
                        <th className="standings-th is-left" style={{ width: 32 }}>#</th>
                        <th className="standings-th is-left">Participant</th>
                        {!compact && <th className="standings-th">MP</th>}
                        <th className="standings-th">W</th>
                        {showDraws && <th className="standings-th">D</th>}
                        <th className="standings-th">L</th>
                        {showGoals && !compact && (
                            <>
                                <th className="standings-th">GF</th>
                                <th className="standings-th">GA</th>
                                <th className="standings-th">GD</th>
                            </>
                        )}
                        <th className="standings-th">Pts</th>
                    </tr>
                </thead>
                <tbody>
                    {standings.map((entry) => (
                        <tr
                            key={entry.participant.id}
                            className={cn(
                                "standings-row",
                                onParticipantClick && "is-clickable",
                                entry.rank <= 3 && "is-top3",
                            )}
                            onClick={() => onParticipantClick?.(entry.participant)}
                        >
                            <td className="standings-td is-left text-muted-foreground">{entry.rank}</td>
                            <td className="standings-td is-left">
                                <div className="flex items-center gap-2 min-w-0">
                                    {entry.participant.seed != null && (
                                        <span className="text-[10px] font-mono text-muted-foreground">
                                            [{entry.participant.seed}]
                                        </span>
                                    )}
                                    <span className="truncate font-medium">{entry.participant.name}</span>
                                </div>
                            </td>
                            {!compact && <td className="standings-td text-muted-foreground">{entry.matchesPlayed}</td>}
                            <td className="standings-td text-green-400">{entry.wins}</td>
                            {showDraws && <td className="standings-td text-muted-foreground">{entry.draws}</td>}
                            <td className="standings-td text-red-400">{entry.losses}</td>
                            {showGoals && !compact && (
                                <>
                                    <td className="standings-td">{entry.goalsFor ?? 0}</td>
                                    <td className="standings-td">{entry.goalsAgainst ?? 0}</td>
                                    <td className={cn(
                                        "standings-td font-bold",
                                        (entry.goalDifference ?? 0) > 0 && "text-green-400",
                                        (entry.goalDifference ?? 0) < 0 && "text-red-400",
                                    )}>
                                        {(entry.goalDifference ?? 0) > 0 ? "+" : ""}{entry.goalDifference ?? 0}
                                    </td>
                                </>
                            )}
                            <td className="standings-td font-bold text-primary">{entry.points}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
