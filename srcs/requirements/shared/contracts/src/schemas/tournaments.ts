import { z } from "zod";
import { SPORT_MODES } from "../constants/sports";

export const TournamentSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    sportId: z.string().uuid(),
    name: z.string().min(3).max(100),
    slug: z.string(),
    description: z.string().nullable().optional(),

    mode: z.enum(SPORT_MODES),
    minTeamSize: z.number().int().min(1),
    maxTeamSize: z.number().int().min(1),
    allowDraws: z.boolean(),
    requiredHandleType: z.string().nullable(),

    minParticipants: z.number().int().min(2),
    maxParticipants: z.number().int().min(2),

    status: z.enum(["draft", "registration", "upcoming", "ongoing", "completed", "cancelled"]),
    bracketType: z.enum(["single_elimination", "double_elimination", "round_robin", "swiss", "free_for_all"]),
    
    isPrivate: z.boolean().optional(),
    customSettings: z.record(z.any()),  // Dynamic TO decisions

    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

export type Tournament = z.infer<typeof TournamentSchema>;

// Payload for creating a new tournament (Admin/Org Owner)
export const CreateTournamentSchema = z.object({
    organizationId: z.string().uuid(),
    sportId: z.string().uuid(),
    name: z.string().min(3).max(100),
    description: z.string().max(500).optional(),
    bracketType: z.enum(["single_elimination", "double_elimination", "round_robin", "swiss", "free_for_all"]),
    
    // --- Manual Overrides (Defaulted from Blueprint by Frontend) ---
    mode: z.enum(SPORT_MODES),
    minTeamSize: z.number().int().min(1),
    maxTeamSize: z.number().int().min(1),
    allowDraws: z.boolean(),
    requiredHandleType: z.string().nullable(),

    minParticipants: z.number().int().min(2),
    maxParticipants: z.number().int().min(2),

    customSettings: z.record(z.any()).optional(),
});

export type CreateTournament = z.infer<typeof CreateTournamentSchema>;
