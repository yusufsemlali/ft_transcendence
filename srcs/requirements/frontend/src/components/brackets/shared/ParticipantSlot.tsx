"use client";

import { cn } from "@/lib/utils";
import type { ParticipantSlotProps } from "../types";

export function ParticipantSlot({
    participant,
    score,
    isWinner,
    isLoser,
    matchStatus,
    onClick,
    className,
}: ParticipantSlotProps) {
    const isCompleted = matchStatus === "completed";
    const isTBD = !participant;

    return (
        <div
            className={cn(
                "match-card-slot",
                isCompleted && isWinner && "is-winner",
                isCompleted && isLoser && "is-loser",
                participant && onClick && "is-clickable",
                className,
            )}
            onClick={() => participant && onClick?.(participant)}
        >
            {participant?.seed != null && (
                <span className="match-card-seed">
                    {participant.seed}
                </span>
            )}

            <span
                className={cn(
                    "match-card-name",
                    isTBD && "is-tbd",
                    isCompleted && isWinner && "is-winner",
                    isCompleted && isLoser && "is-loser",
                )}
            >
                {participant?.name ?? "TBD"}
            </span>

            {matchStatus !== "pending" && (
                <span
                    className={cn(
                        "match-card-score",
                        isCompleted && isWinner && "is-winner",
                        isCompleted && isLoser && "is-loser",
                        matchStatus === "ongoing" && "is-live",
                    )}
                >
                    {score}
                </span>
            )}

            {isCompleted && isWinner && (
                <div className="match-card-win-bar" />
            )}
        </div>
    );
}
