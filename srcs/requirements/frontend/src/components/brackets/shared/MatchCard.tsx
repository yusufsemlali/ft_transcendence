"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ParticipantSlot } from "./ParticipantSlot";
import type { MatchCardProps } from "../types";

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" | "success" }> = {
    pending: { label: "Pending", variant: "secondary" },
    ongoing: { label: "Live", variant: "default" },
    completed: { label: "Done", variant: "success" },
    disputed: { label: "Disputed", variant: "destructive" },
    cancelled: { label: "Cancelled", variant: "outline" },
};

export function MatchCard({
    match,
    variant = "default",
    final = false,
    onClick,
    onParticipantClick,
    renderParticipant,
    className,
}: MatchCardProps) {
    const isCompact = variant === "compact";
    const badge = STATUS_BADGE[match.status] ?? STATUS_BADGE.pending;
    const p1Winner = match.winnerId != null && match.winnerId === match.participant1?.id;
    const p2Winner = match.winnerId != null && match.winnerId === match.participant2?.id;

    return (
        <div
            className={cn(
                "match-card",
                final && "match-card-final",
                onClick && "cursor-pointer",
                match.status === "ongoing" && "is-live",
                className,
            )}
            onClick={() => onClick?.(match)}
        >
            {match.status === "ongoing" && (
                <div className="match-card-live-strip animate-pulse" />
            )}

            <div className="relative">
                {renderParticipant ? (
                    <div className="match-card-slot">
                        {renderParticipant(match.participant1, match.id, "top")}
                    </div>
                ) : (
                    <ParticipantSlot
                        participant={match.participant1}
                        score={match.score1}
                        isWinner={p1Winner}
                        isLoser={match.status === "completed" && !p1Winner && match.winnerId != null}
                        matchStatus={match.status}
                        onClick={onParticipantClick}
                    />
                )}

                <div className="match-card-divider" />

                {renderParticipant ? (
                    <div className="match-card-slot">
                        {renderParticipant(match.participant2, match.id, "bottom")}
                    </div>
                ) : (
                    <ParticipantSlot
                        participant={match.participant2}
                        score={match.score2}
                        isWinner={p2Winner}
                        isLoser={match.status === "completed" && !p2Winner && match.winnerId != null}
                        matchStatus={match.status}
                        onClick={onParticipantClick}
                    />
                )}
            </div>

            {!isCompact && (
                <div className="match-card-footer">
                    <Badge variant={badge.variant}>
                        {badge.label}
                    </Badge>
                    {match.scheduledAt && (
                        <span className="match-card-date">
                            {new Date(match.scheduledAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                            })}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
