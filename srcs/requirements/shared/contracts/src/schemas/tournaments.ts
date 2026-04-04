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
    createdAt: true,
});

export type Tournament = z.infer<typeof TournamentSchema>;
export type PublicTournament = z.infer<typeof PublicTournamentSchema>;

export const CreateTournamentSchema = z.object({
    sportId: z.string().uuid(),
    name: z.string().min(3).max(100),
    description: z.string().max(500).optional(),
    bracketType: z.enum(["single_elimination", "double_elimination", "round_robin", "swiss", "free_for_all"]),
    isPrivate: z.boolean().default(false).optional(),
    mode: z.enum(SPORT_MODES),
    minTeamSize: z.number().int().min(1),
    maxTeamSize: z.number().int().min(1),
    allowDraws: z.boolean(),
    requiredHandleType: z.string().nullable(),
    minParticipants: z.number().int().min(2),
    maxParticipants: z.number().int().min(2),
    customSettings: z.record(z.any()).optional(),
});

export const UpdateTournamentSchema = CreateTournamentSchema.omit({
    sportId: true, 
}).partial().strict();

export type CreateTournament = z.infer<typeof CreateTournamentSchema>;
export type UpdateTournament = z.infer<typeof UpdateTournamentSchema>;
