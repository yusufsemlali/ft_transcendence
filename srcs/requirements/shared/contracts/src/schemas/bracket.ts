import { z } from "zod";

export const BRACKET_TYPES = [
    "single_elimination",
    "round_robin",
] as const;

export const MATCH_STATUSES = [
    "pending",
    "ongoing",
    "completed",
    "disputed",
    "cancelled",
] as const;

export const PARTICIPANT_STATUSES = [
    "active",
    "eliminated",
    "disqualified",
] as const;



export const BracketParticipantSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    seed: z.number().int().nullable(),
    imageUrl: z.string().nullable().optional(),
    status: z.enum(PARTICIPANT_STATUSES),
});

export const BracketMatchSchema = z.object({
    id: z.string().uuid(),
    position: z.number().int(),
    participant1: BracketParticipantSchema.nullable(),
    participant2: BracketParticipantSchema.nullable(),
    score1: z.number().int(),
    score2: z.number().int(),
    winnerId: z.string().uuid().nullable(),
    status: z.enum(MATCH_STATUSES),
    nextMatchId: z.string().uuid().nullable(),
    scheduledAt: z.coerce.date().nullable().optional(),
    completedAt: z.coerce.date().nullable().optional(),
});

export const BracketRoundSchema = z.object({
    number: z.number().int(),
    label: z.string(),
    matches: z.array(BracketMatchSchema),
});

export const StandingsEntrySchema = z.object({
    rank: z.number().int(),
    participant: BracketParticipantSchema,
    wins: z.number().int(),
    losses: z.number().int(),
    draws: z.number().int(),
    points: z.number(),
    matchesPlayed: z.number().int(),
    goalsFor: z.number().int().optional(),
    goalsAgainst: z.number().int().optional(),
    goalDifference: z.number().int().optional(),
    group: z.number().int().optional(),
});

export const BracketMetadataSchema = z.object({
    totalRounds: z.number().int(),
    currentRound: z.number().int(),
    groups: z.number().int().optional(),
});

export const BracketStateSchema = z.object({
    tournamentId: z.string().uuid(),
    bracketType: z.enum(BRACKET_TYPES),
    status: z.enum(["draft", "registration", "upcoming", "ongoing", "completed", "cancelled"]),
    participants: z.array(BracketParticipantSchema),
    rounds: z.array(BracketRoundSchema),
    standings: z.array(StandingsEntrySchema),
    metadata: BracketMetadataSchema,
});

/** Update live scores only — does not complete the match or advance the bracket. */
export const PatchMatchScoresSchema = z.object({
    score1: z.number().int().min(0),
    score2: z.number().int().min(0),
});

/** Lock result, mark completed, advance bracket (elimination), etc. */
export const FinalizeMatchSchema = z.object({
    score1: z.number().int().min(0),
    score2: z.number().int().min(0),
    winnerId: z.string().uuid().optional(),
});

/** @deprecated Use FinalizeMatchSchema — kept as alias for older imports */
export const ReportScoreSchema = FinalizeMatchSchema;

export type BracketType = z.infer<typeof BracketStateSchema>["bracketType"];
export type BracketParticipant = z.infer<typeof BracketParticipantSchema>;
export type BracketMatch = z.infer<typeof BracketMatchSchema>;
export type BracketRound = z.infer<typeof BracketRoundSchema>;
export type StandingsEntry = z.infer<typeof StandingsEntrySchema>;
export type BracketMetadata = z.infer<typeof BracketMetadataSchema>;
export type BracketState = z.infer<typeof BracketStateSchema>;
export type PatchMatchScores = z.infer<typeof PatchMatchScoresSchema>;
export type FinalizeMatch = z.infer<typeof FinalizeMatchSchema>;
/** @deprecated Use FinalizeMatch */
export type ReportScore = FinalizeMatch;
