import type { ReactNode } from "react";
import type {
    BracketState,
    BracketMatch,
    BracketParticipant,
    BracketRound,
    StandingsEntry,
    BracketMetadata,
} from "@ft-transcendence/contracts";

export type {
    BracketState,
    BracketMatch,
    BracketParticipant,
    BracketRound,
    StandingsEntry,
    BracketMetadata,
};

export interface BracketViewProps {
    data: BracketState;
    onMatchClick?: (match: BracketMatch) => void;
    onParticipantClick?: (participant: BracketParticipant) => void;
    renderParticipant?: (
        participant: BracketParticipant | null,
        matchId: string,
        slot: "top" | "bottom",
    ) => ReactNode;
    className?: string;
    compact?: boolean;
}

export interface MatchCardProps {
    match: BracketMatch;
    variant?: "default" | "compact";
    /** Emphasize grand-final style (gradient border, slot padding). */
    final?: boolean;
    onClick?: (match: BracketMatch) => void;
    onParticipantClick?: (participant: BracketParticipant) => void;
    renderParticipant?: BracketViewProps["renderParticipant"];
    className?: string;
}

export interface ParticipantSlotProps {
    participant: BracketParticipant | null;
    score: number;
    isWinner: boolean;
    isLoser: boolean;
    matchStatus: BracketMatch["status"];
    onClick?: (participant: BracketParticipant) => void;
    className?: string;
}

export interface StandingsTableProps {
    standings: StandingsEntry[];
    bracketType: BracketState["bracketType"];
    onParticipantClick?: (participant: BracketParticipant) => void;
    className?: string;
    compact?: boolean;
}
