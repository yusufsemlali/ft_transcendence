import { z } from "zod";

export const TournamentSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    sportId: z.string().uuid(),
    name: z.string().min(3).max(100),
    slug: z.string(),
    description: z.string().nullable().optional(),
    status: z.enum(["draft", "registration", "upcoming", "ongoing", "completed", "cancelled"]),
    bracketType: z.enum(["single_elimination", "double_elimination", "round_robin", "swiss", "free_for_all"]),
    maxParticipants: z.number().int().min(2).max(256),
    isPrivate: z.boolean().optional(),
    createdAt: z.coerce.date(),
});

export const CreateTournamentSchema = z.object({
    organizationId: z.string().uuid(),
    sportId: z.string().uuid(),
    name: z.string().min(3).max(100),
    description: z.string().max(500).optional(),
    format: z.enum(["single_elimination", "double_elimination", "round_robin", "swiss", "free_for_all"]),
    maxParticipants: z.number().int().min(2).max(256),
});

export type Tournament = z.infer<typeof TournamentSchema>;
export type CreateTournament = z.infer<typeof CreateTournamentSchema>;
