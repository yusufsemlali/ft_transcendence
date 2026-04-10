"use client";

import { cn } from "@/lib/utils";
import { MatchCard } from "./MatchCard";
import { RoundHeader } from "./RoundHeader";
import type { BracketRound, BracketViewProps } from "../types";

interface RoundColumnProps {
    round: BracketRound;
    matchSpacing?: number;
    variant?: "default" | "compact";
    onMatchClick?: BracketViewProps["onMatchClick"];
    onParticipantClick?: BracketViewProps["onParticipantClick"];
    renderParticipant?: BracketViewProps["renderParticipant"];
    className?: string;
}

export function RoundColumn({
    round,
    variant = "default",
    onMatchClick,
    onParticipantClick,
    renderParticipant,
    className,
}: RoundColumnProps) {
    return (
        <div className={cn("flex flex-col items-center shrink-0", className)}>
            <RoundHeader
                roundNumber={round.number}
                label={round.label}
                meta={`${round.matches.length} match${round.matches.length !== 1 ? "es" : ""}`}
            />

            <div className={cn("bracket-match-col justify-around flex-1")}>
                {round.matches.map((match) => (
                    <MatchCard
                        key={match.id}
                        match={match}
                        variant={variant}
                        onClick={onMatchClick}
                        onParticipantClick={onParticipantClick}
                        renderParticipant={renderParticipant}
                    />
                ))}
            </div>
        </div>
    );
}
