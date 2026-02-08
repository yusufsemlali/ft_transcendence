import { db } from "@/dal/db";
import { gameProfiles } from "@/dal/db/schemas/game_profiles";
import { supportedGameEnum } from "@/dal/db/schemas/enums";
import { eq, and } from "drizzle-orm";
import AppError from "@/utils/error";

type NewGameProfile = typeof gameProfiles.$inferInsert;
type SupportedGame = (typeof supportedGameEnum.enumValues)[number];

export const createGameProfile = async (
    userId: string,
    game: SupportedGame,
    gameIdentifier: string,
    metadata: Record<string, any> = {}
) => {
    const existingProfile = await db.query.gameProfiles.findFirst({
        where: and(
            eq(gameProfiles.userId, userId),
            eq(gameProfiles.game, game)
        ),
    });

    if (existingProfile) {
        throw new AppError(409, `User already has a profile for ${game}`);
    }

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

export const getGameProfile = async (userId: string, game: SupportedGame) => {
    const profile = await db.query.gameProfiles.findFirst({
        where: and(
            eq(gameProfiles.userId, userId),
            eq(gameProfiles.game, game)
        ),
    });

    return profile;
};

export const getUserGameProfiles = async (userId: string) => {
    const profiles = await db.query.gameProfiles.findMany({
        where: eq(gameProfiles.userId, userId),
    });

    return profiles;
};

export const updateGameProfile = async (
    userId: string,
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

export const verifyGameProfile = async (
    userId: string,
    game: SupportedGame,
    proof: string
) => {
    return updateGameProfile(userId, game, {
        isVerified: true,
        verificationProof: proof,
    });
};

export const deleteGameProfile = async (userId: string, game: SupportedGame) => {
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
