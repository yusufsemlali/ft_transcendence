"use client";

import { useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { MatchCard, BracketConnector, RoundHeader } from "../shared";
import type { BracketViewProps, BracketRound } from "../types";

export function DoubleEliminationBracket({
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

    const winnersRounds = useMemo(
        () => data.rounds.filter((r: BracketRound) => r.section === "winners"),
        [data.rounds],
    );
    const losersRounds = useMemo(
        () => data.rounds.filter((r: BracketRound) => r.section === "losers"),
        [data.rounds],
    );
    const grandFinals = useMemo(
        () => data.rounds.filter((r: BracketRound) => r.section === "grand_finals"),
        [data.rounds],
    );

    const connections = useMemo(() => {
        const conns: Array<{ fromId: string; toId: string }> = [];
        for (const round of data.rounds) {
            for (const match of round.matches) {
                if (match.nextMatchId) {
                    conns.push({ fromId: match.id, toId: match.nextMatchId });
                }
            }
        }
        return conns;
    }, [data.rounds]);

    if (data.rounds.length === 0) {
        return (
            <div className={cn("ds-empty-state", className)}>
                No bracket generated yet.
            </div>
        );
    }

    const variant = compact ? "compact" : "default";

    const renderSection = (rounds: typeof winnersRounds, label: string, icon: string) => (
        <div className="bracket-de-section">
            <div className="bracket-de-section-header">
                <span className="material-symbols-outlined bracket-de-section-icon text-primary">
                    {icon}
                </span>
                <h2 className="bracket-de-section-title">{label}</h2>
                <div className="bracket-de-section-rule" />
            </div>
            <div className="bracket-rounds-row px-6 items-stretch">
                {rounds.map((round) => (
                    <div key={round.number} className="flex flex-col items-center shrink-0">
                        <RoundHeader roundNumber={round.number} label={round.label} />
                        <div className="bracket-match-col justify-around flex-1">
                            {round.matches.map((match) => (
                                <div
                                    key={match.id}
                                    ref={(el) => setMatchRef(match.id, el)}
                                    className="relative z-10"
                                >
                                    {round.section === "grand_finals" ? (
                                        <div className="match-card-final-wrap">
                                            <span
                                                className="material-symbols-outlined match-card-final-trophy"
                                                aria-hidden
                                            >
                                                emoji_events
                                            </span>
                                            <MatchCard
                                                match={match}
                                                variant={variant}
                                                final
                                                onClick={onMatchClick}
                                                onParticipantClick={onParticipantClick}
                                                renderParticipant={renderParticipant}
                                            />
                                        </div>
                                    ) : (
                                        <MatchCard
                                            match={match}
                                            variant={variant}
                                            onClick={onMatchClick}
                                            onParticipantClick={onParticipantClick}
                                            renderParticipant={renderParticipant}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div
            ref={containerRef}
            className={cn("relative overflow-x-auto overflow-y-hidden", className)}
        >
            <div className="min-w-max relative py-6 px-2">
                <BracketConnector
                    containerRef={containerRef}
                    matchRefs={matchRefs}
                    connections={connections}
                />
                {renderSection(winnersRounds, "Winners Bracket", "emoji_events")}
                {renderSection(losersRounds, "Losers Bracket", "keyboard_double_arrow_down")}
                {grandFinals.length > 0 && renderSection(grandFinals, "Grand Finals", "star")}
            </div>
        </div>
    );
}
