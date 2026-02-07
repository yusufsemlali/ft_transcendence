import { z } from "zod";

// Enum for supported games (must match backend enum)
export const SupportedGameSchema = z.enum(['league_of_legends', 'cs2', 'valorant', 'dota2', 'overwatch2']);
export type SupportedGame = z.infer<typeof SupportedGameSchema>;

export const GameProfileSchema = z.object({
    id: z.number(),
    userId: z.number(),
    game: SupportedGameSchema,
    gameIdentifier: z.string(),
    rank: z.string().nullable(),
    level: z.number().nullable(),
    isVerified: z.boolean(),
    verificationProof: z.string().nullable(),
    isVisible: z.boolean(),
    metadata: z.record(z.any()), // JSONB
    createdAt: z.string().or(z.date()), // timestamps come as strings often
    updatedAt: z.string().or(z.date()),
});

export type GameProfile = z.infer<typeof GameProfileSchema>;

// Request Schemas
export const CreateGameProfileSchema = z.object({
    game: SupportedGameSchema,
    gameIdentifier: z.string().min(1, "Game identifier is required"),
    metadata: z.record(z.any()).optional(),
});
export type CreateGameProfile = z.infer<typeof CreateGameProfileSchema>;

export const UpdateGameProfileSchema = z.object({
    rank: z.string().optional(),
    level: z.number().optional(),
    isVisible: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
});
export type UpdateGameProfile = z.infer<typeof UpdateGameProfileSchema>;
