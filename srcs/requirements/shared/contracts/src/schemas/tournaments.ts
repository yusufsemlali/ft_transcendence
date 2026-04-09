import { z } from "zod";
import { SPORT_MODES } from "../constants/sports";

export const TournamentSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    sportId: z.string().uuid(),
    name: z.string().min(3).max(100),
    slug: z.string(),
    description: z.string().nullable().optional(),
    scoringType: z.string(), 
    matchConfigSchema: z.record(z.any()),
    mode: z.enum(SPORT_MODES),
    minTeamSize: z.number().int().min(1),
    maxTeamSize: z.number().int().min(1),
    allowDraws: z.boolean(),
    requiredHandleType: z.string().nullable(),
    minParticipants: z.number().int().min(2),
    maxParticipants: z.number().int().min(2),
    status: z.enum(["draft", "registration", "upcoming", "ongoing", "completed", "cancelled"]),
    bracketType: z.enum(["single_elimination", "double_elimination", "round_robin", "swiss", "free_for_all"]),
    isPrivate: z.boolean(),
    prizePool: z.string().nullable().optional(),
    entryFee: z.number().int().nonnegative().default(0),
    bannerUrl: z.string().nullable().optional(),
    customSettings: z.record(z.any()),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

export const PublicTournamentSchema = TournamentSchema.pick({
    id: true,
    organizationId: true,
    sportId: true,
    name: true,
    slug: true,
    description: true,
    status: true,
    bracketType: true,
    mode: true,
    minTeamSize: true,
    maxTeamSize: true,
    minParticipants: true,
    maxParticipants: true,
    scoringType: true,
    prizePool: true,
    entryFee: true,
    bannerUrl: true,
    createdAt: true,
});

/** Status values allowed when filtering public discovery (excludes draft). */
export const TOURNAMENT_DISCOVERY_STATUSES = [
    "registration",
    "upcoming",
    "ongoing",
    "completed",
    "cancelled",
] as const;

export const TournamentDiscoveryStatusSchema = z.enum(TOURNAMENT_DISCOVERY_STATUSES);

/** Public list + detail payload with host and sport labels (joined server-side). */
export const PublicTournamentDiscoverySchema = PublicTournamentSchema.extend({
    sportName: z.string(),
    organizationName: z.string(),
    organizationSlug: z.string(),
});

export type Tournament = z.infer<typeof TournamentSchema>;
export type PublicTournament = z.infer<typeof PublicTournamentSchema>;
export type PublicTournamentDiscovery = z.infer<typeof PublicTournamentDiscoverySchema>;

export const CreateTournamentSchema = z.object({
    sportId: z.string().uuid(),
    name: z.string().min(3).max(100),
    description: z.string().max(500).nullable().optional(),
    bracketType: z.enum(["single_elimination", "double_elimination", "round_robin", "swiss", "free_for_all"]),
    isPrivate: z.boolean().default(false).optional(),
    mode: z.enum(SPORT_MODES),
    minTeamSize: z.number().int().min(1),
    maxTeamSize: z.number().int().min(1),
    allowDraws: z.boolean(),
    requiredHandleType: z.string().nullable(),
    minParticipants: z.number().int().min(2),
    maxParticipants: z.number().int().min(2),
    prizePool: z.string().nullable().optional(),
    entryFee: z.number().int().nonnegative().optional(),
    bannerUrl: z.string().nullable().optional(),
    customSettings: z.record(z.any()).optional(),
    matchConfigSchema: z.record(z.any()).optional(),
});

export const UpdateTournamentSchema = CreateTournamentSchema.omit({
    sportId: true, 
}).extend({
    status: TournamentSchema.shape.status.optional(),
}).partial().strict();

export type CreateTournament = z.infer<typeof CreateTournamentSchema>;
export type UpdateTournament = z.infer<typeof UpdateTournamentSchema>;
