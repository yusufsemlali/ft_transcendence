import { z } from "zod";

export const TournamentSchema = z.object({
    id: z.number().int(),
    name: z.string().min(3).max(50),
    description: z.string().max(255).optional(),
    maxParticipants: z.number().int().min(2).max(64),
    status: z.enum(["draft", "registration", "upcoming", "ongoing", "completed", "cancelled"]),
    createdAt: z.date(),
});

export const CreateTournamentSchema = TournamentSchema.omit({
    id: true,
    createdAt: true,
    status: true,
});

export type Tournament = z.infer<typeof TournamentSchema>;
export type CreateTournament = z.infer<typeof CreateTournamentSchema>;
