"use client";

import React, { useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { MatchCard, BracketConnector, RoundHeader } from "../shared";
import type { BracketViewProps, BracketMatch, BracketRound } from "../types";

export function SingleEliminationBracket({
    data,
    onMatchClick,
    onParticipantClick,
    renderParticipant,
    className,
    compact,
}: BracketViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const matchRefs = useRef(new Map<string, HTMLElement>());

    const setMatchRef = useCallback((id: string, el: HTMLElement | null) => {
        if (el) matchRefs.current.set(id, el);
        else matchRefs.current.delete(id);
    }, []);

    const rounds = useMemo(() => data.rounds, [data.rounds]);

    const connections = useMemo(() => {
        const conns: Array<{ fromId: string; toId: string }> = [];
        for (const round of rounds) {
            for (const match of round.matches) {
                if (match.nextMatchId) {
                    conns.push({ fromId: match.id, toId: match.nextMatchId });
                }
            }
        }
        return conns;
    }, [rounds]);

    if (rounds.length === 0) {
        return (
            <div className={cn("ds-empty-state", className)}>
                No bracket generated yet.
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={cn("relative overflow-x-auto overflow-y-hidden", className)}
        >
            <BracketConnector
                containerRef={containerRef}
                matchRefs={matchRefs}
                connections={connections}
            />

            <div className="bracket-rounds-row py-2 items-stretch relative">
                {rounds.map((round: BracketRound) => (
                    <div key={round.number} className="flex flex-col items-center shrink-0">
                        <RoundHeader roundNumber={round.number} label={round.label} />
                        <div className="bracket-match-col justify-around flex-1">
                            {round.matches.map((match: BracketMatch) => (
                                <div
                                    key={match.id}
                                    ref={(el) => setMatchRef(match.id, el)}
                                    className="relative z-10"
                                >
                                    <MatchCard
                                        match={match}
                                        variant={compact ? "compact" : "default"}
                                        onClick={onMatchClick}
                                        onParticipantClick={onParticipantClick}
                                        renderParticipant={renderParticipant}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
