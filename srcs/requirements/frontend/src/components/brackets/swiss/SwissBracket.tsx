"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MatchCard, RoundHeader, StandingsTable } from "../shared";
import type { BracketViewProps } from "../types";

export function SwissBracket({
    data,
    onMatchClick,
    onParticipantClick,
    renderParticipant,
    className,
    compact,
}: BracketViewProps) {
    const [activeRound, setActiveRound] = useState<number | null>(
        data.metadata.currentRound || (data.rounds[0]?.number ?? null),
    );

    if (data.rounds.length === 0) {
        return (
            <div className={cn("ds-empty-state", className)}>
                No bracket generated yet.
            </div>
        );
    }

    const currentRound = data.rounds.find((r) => r.number === activeRound) ?? data.rounds[0];

    return (
        <div className={cn("bracket-shell", className)}>
            <div className="swiss-layout">
                <div className="swiss-main">
                    <div className="swiss-round-tabs">
                        <div className="ds-tabs-wrap">
                            <div className="ds-tabs-list">
                                {data.rounds.map((round) => {
                                    const allComplete = round.matches.every(
                                        (m) => m.status === "completed" || m.status === "cancelled",
                                    );
                                    const hasOngoing = round.matches.some((m) => m.status === "ongoing");
                                    return (
                                        <button
                                            key={round.number}
                                            className={cn("ds-tab", activeRound === round.number && "is-active")}
                                            onClick={() => setActiveRound(round.number)}
                                        >
                                            {round.label}
                                            {hasOngoing && (
                                                <span className="ml-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                                            )}
                                            {allComplete && (
                                                <span className="material-symbols-outlined ml-1 text-xs">check_circle</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {currentRound && (
                        <>
                            <RoundHeader
                                roundNumber={currentRound.number}
                                label={currentRound.label}
                                align="left"
                                className="swiss-round-header"
                            />
                            <div className="match-grid">
                                {currentRound.matches.map((match) => (
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
                        </>
                    )}
                </div>

                <div className="swiss-side">
                    <div className="glass-card bracket-section lg:sticky lg:top-4">
                        <h3 className="bracket-section-title">Standings</h3>
                        <StandingsTable
                            standings={data.standings}
                            bracketType={data.bracketType}
                            onParticipantClick={onParticipantClick}
                            compact={compact}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
