import { db } from "@/dal/db";
import { gameProfiles } from "@/dal/db/schemas/game_profiles";
import { supportedGameEnum } from "@/dal/db/schemas/enums";
import { eq, and } from "drizzle-orm";
import AppError from "@/utils/error";

// Infer types from schema
type NewGameProfile = typeof gameProfiles.$inferInsert;
type GameProfile = typeof gameProfiles.$inferSelect;
type SupportedGame = (typeof supportedGameEnum.enumValues)[number];

/**
 * Creates a new game profile for a use.
 * Enforces one profile per game per user constraint.
 */
export const createGameProfile = async (
    userId: number,
    game: SupportedGame,
    gameIdentifier: string,
    metadata: Record<string, any> = {}
) => {
    // Check if user already has a profile for this game
    const existingProfile = await db.query.gameProfiles.findFirst({
        where: and(
            eq(gameProfiles.userId, userId),
            eq(gameProfiles.game, game)
        ),
    });

    if (existingProfile) {
        throw new AppError(409, `User already has a profile for ${game}`);
    }

    // Check if game identifier is typically unique (e.g. Steam ID is globally unique)
    // We enforce uniqueness to prevent multiple users claiming the same account
    const existingIdentifier = await db.query.gameProfiles.findFirst({
        where: and(
            eq(gameProfiles.game, game),
            eq(gameProfiles.gameIdentifier, gameIdentifier)
        ),
    });

    if (existingIdentifier) {
        throw new AppError(409, `This ${game} account is already linked to another user`);
    }

    const [newProfile] = await db
        .insert(gameProfiles)
        .values({
            userId,
            game,
            gameIdentifier,
            metadata,
        })
        .returning();

    return newProfile;
};

/**
 * Get a specific game profile for a user
 */
export const getGameProfile = async (userId: number, game: SupportedGame) => {
    const profile = await db.query.gameProfiles.findFirst({
        where: and(
            eq(gameProfiles.userId, userId),
            eq(gameProfiles.game, game)
        ),
    });

    return profile;
};

/**
 * Get all game profiles for a user
 */
export const getUserGameProfiles = async (userId: number) => {
    const profiles = await db.query.gameProfiles.findMany({
        where: eq(gameProfiles.userId, userId),
    });

    return profiles;
};

/**
 * Update a game profile (e.g. updating rank or metadata)
 */
export const updateGameProfile = async (
    userId: number,
    game: SupportedGame,
    data: Partial<Omit<NewGameProfile, 'id' | 'userId' | 'game'>>
) => {
    const [updatedProfile] = await db
        .update(gameProfiles)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(and(
            eq(gameProfiles.userId, userId),
            eq(gameProfiles.game, game)
        ))
        .returning();

    if (!updatedProfile) {
        throw new AppError(404, "Game profile not found");
    }

    return updatedProfile;
};

/**
 * Verify a game profile
 * This is crucial for tournament integrity.
 */
export const verifyGameProfile = async (
    userId: number,
    game: SupportedGame,
    proof: string
) => {
    return updateGameProfile(userId, game, {
        isVerified: true,
        verificationProof: proof,
    });
};

/**
 * Delete a game profile
 */
export const deleteGameProfile = async (userId: number, game: SupportedGame) => {
    const result = await db
        .delete(gameProfiles)
        .where(
            and(
                eq(gameProfiles.userId, userId),
                eq(gameProfiles.game, game)
            )
        )
        .returning();

    if (result.length === 0) {
        throw new AppError(404, "Game profile not found");
    }
};
