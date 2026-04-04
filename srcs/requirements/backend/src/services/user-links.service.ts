import { db } from "@/dal/db";
import { handles } from "@/dal/db/schemas/handles";
import { linkedAccounts } from "@/dal/db/schemas/linked_accounts";
import { eq, and } from "drizzle-orm";
import AppError from "@/utils/error";
import { ApiResponse } from "@/utils/response";

/**
 * Handles (Game Profiles)
 */

export const createHandle = async (
    userId: string,
    sportId: string,
    handle: string,
    metadata: Record<string, any> = {}
) => {
    // Check if user already has a handle for this sport
    const existingHandle = await db.query.handles.findFirst({
        where: and(
            eq(handles.userId, userId),
            eq(handles.sportId, sportId)
        ),
    });

    if (existingHandle) {
        throw new AppError(409, "You already have a handle linked for this sport/game.");
    }

    // Check if this specific handle is globally unique for this sport
    const duplicateHandle = await db.query.handles.findFirst({
        where: and(
            eq(handles.sportId, sportId),
            eq(handles.handle, handle)
        ),
    });

    if (duplicateHandle) {
        throw new AppError(409, "This handle is already claimed by another player.");
    }

    const [newHandle] = await db
        .insert(handles)
        .values({
            userId,
            sportId,
            handle,
            metadata,
        })
        .returning();

    return new ApiResponse("Handle linked successfully", newHandle);
};

export const getUserHandles = async (userId: string) => {
    const data = await db.query.handles.findMany({
        where: eq(handles.userId, userId),
    });

    return new ApiResponse("User handles fetched", data);
};

export const updateHandle = async (
    userId: string,
    handleId: string,
    data: Partial<{ handle: string; metadata: any }>
) => {
    const [updated] = await db
        .update(handles)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(and(
            eq(handles.id, handleId),
            eq(handles.userId, userId)
        ))
        .returning();

    if (!updated) {
        throw new AppError(404, "Handle not found or unauthorized");
    }

    return new ApiResponse("Handle updated successfuly", updated);
};

export const deleteHandle = async (userId: string, handleId: string) => {
    const result = await db
        .delete(handles)
        .where(
            and(
                eq(handles.id, handleId),
                eq(handles.userId, userId)
            )
        )
        .returning();

    if (result.length === 0) {
        throw new AppError(404, "Handle not found or unauthorized");
    }
};

/**
 * Linked Accounts (Identities)
 */

export const getLinkedAccounts = async (userId: string) => {
    const data = await db.query.linkedAccounts.findMany({
        where: eq(linkedAccounts.userId, userId),
    });

    return new ApiResponse("Linked accounts fetched", data);
};

export const deleteLinkedAccount = async (userId: string, accountId: string) => {
    const result = await db
        .delete(linkedAccounts)
        .where(
            and(
                eq(linkedAccounts.id, accountId),
                eq(linkedAccounts.userId, userId)
            )
        )
        .returning();

    if (result.length === 0) {
        throw new AppError(404, "Linked account not found or unauthorized");
    }
};
