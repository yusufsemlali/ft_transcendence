"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { MatchCard, StandingsTable } from "../shared";
import type { BracketViewProps, StandingsEntry } from "../types";

export function FreeForAllBracket({
    data,
    onMatchClick,
    onParticipantClick,
    renderParticipant,
    className,
    compact,
}: BracketViewProps) {
    const groupData = useMemo(() => {
        const groups: Array<{
            groupNumber: number;
            rounds: typeof data.rounds;
            standings: StandingsEntry[];
        }> = [];

        const groupNumbers = [...new Set(data.rounds.map((r) => r.number))].sort((a, b) => a - b);

        for (const groupNum of groupNumbers) {
            const groupRounds = data.rounds.filter((r) => r.number === groupNum);
            const participantIds = new Set<string>();
            for (const r of groupRounds) {
                for (const m of r.matches) {
                    if (m.participant1) participantIds.add(m.participant1.id);
                    if (m.participant2) participantIds.add(m.participant2.id);
                }
            }
            const groupStandings = data.standings
                .filter((s) => participantIds.has(s.participant.id))
                .map((s, i) => ({ ...s, rank: i + 1 }));

            groups.push({ groupNumber: groupNum, rounds: groupRounds, standings: groupStandings });
        }

        return groups;
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
                <h3 className="bracket-section-title">Overall Standings</h3>
                <StandingsTable
                    standings={data.standings}
                    bracketType={data.bracketType}
                    onParticipantClick={onParticipantClick}
                    compact={compact}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {groupData.map((group) => (
                    <div key={group.groupNumber} className="glass-card group-card">
                        <div className="group-card-header">
                            <span className="material-symbols-outlined text-primary text-lg">groups</span>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">
                                Group {group.groupNumber}
                            </h3>
                            <div className="group-card-rule" />
                        </div>

                        <StandingsTable
                            standings={group.standings}
                            bracketType={data.bracketType}
                            onParticipantClick={onParticipantClick}
                            compact
                        />

                        <h4 className="group-card-matches-title">Matches</h4>
                        <div className="match-grid">
                            {group.rounds.flatMap((r) =>
                                r.matches.map((match) => (
                                    <MatchCard
                                        key={match.id}
                                        match={match}
                                        variant="compact"
                                        onClick={onMatchClick}
                                        onParticipantClick={onParticipantClick}
                                        renderParticipant={renderParticipant}
                                    />
                                )),
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
