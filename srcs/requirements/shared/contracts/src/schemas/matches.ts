import { z } from "zod";

export const MatchSchema = z.object({
    id: z.string().uuid(),
    tournamentId: z.string().uuid(),
    participant1Id: z.string().uuid().nullable(),
    participant2Id: z.string().uuid().nullable(),
    score1: z.number().int().default(0),
    score2: z.number().int().default(0),
    winnerId: z.string().uuid().nullable(),
    status: z.enum(['pending', 'ongoing', 'completed', 'disputed', 'cancelled']),
    round: z.number().int(),
    position: z.number().int(),
    nextMatchId: z.string().uuid().nullable().optional(),
    matchStats: z.record(z.any()),
    matchConfigSchema: z.record(z.any()),
    scheduledAt: z.coerce.date().nullable().optional(),
    completedAt: z.coerce.date().nullable().optional(),
});

export const UpdateMatchSchema = MatchSchema.partial().omit({ id: true, tournamentId: true }).strict();

export type Match = z.infer<typeof MatchSchema>;
export type UpdateMatch = z.infer<typeof UpdateMatchSchema>;
