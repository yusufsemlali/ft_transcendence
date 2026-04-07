import { db } from "@/dal/db";
import { friendships } from "@/dal/db/schemas/social";
import { users } from "@/dal/db/schemas/users";
import { eq, or, and, SQL } from "drizzle-orm";
import AppError from "@/utils/error";
import { ApiResponse } from "@/utils/response";

type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

interface FriendResult {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string;
    isOnline: boolean;
    status: FriendshipStatus;
    friendshipId: string;
    since: Date;
}

export const getMyFriends = async (
    userId: string,
    statusFilter?: FriendshipStatus
) => {
    const conditions: SQL[] = [
        or(
            eq(friendships.senderId, userId),
            eq(friendships.receiverId, userId)
        )!,
    ];

    if (statusFilter) {
        conditions.push(eq(friendships.status, statusFilter));
    }

    const rows = await db
        .select({
            friendshipId: friendships.id,
            senderId: friendships.senderId,
            receiverId: friendships.receiverId,
            status: friendships.status,
            createdAt: friendships.createdAt,
            senderUserId: users.id,
            senderUsername: users.username,
            senderDisplayName: users.displayName,
            senderAvatar: users.avatar,
            senderIsOnline: users.isOnline,
        })
        .from(friendships)
        .innerJoin(users, or(
            and(eq(friendships.senderId, users.id), eq(friendships.receiverId, userId)),
            and(eq(friendships.receiverId, users.id), eq(friendships.senderId, userId))
        ))
        .where(and(...conditions));

    const friends: FriendResult[] = rows.map((row) => ({
        id: row.senderUserId,
        username: row.senderUsername,
        displayName: row.senderDisplayName,
        avatar: row.senderAvatar,
        isOnline: row.senderIsOnline,
        status: row.status as FriendshipStatus,
        friendshipId: row.friendshipId,
        since: row.createdAt,
    }));

    return new ApiResponse("Friends list fetched successfully", friends);
};

export const getFriendship = async (currentUserId: string, targetUserId: string) => {
    const row = await db
        .select({
            friendshipId: friendships.id,
            senderId: friendships.senderId,
            receiverId: friendships.receiverId,
            status: friendships.status,
            createdAt: friendships.createdAt,
            targetId: users.id,
            targetUsername: users.username,
            targetDisplayName: users.displayName,
            targetAvatar: users.avatar,
            targetIsOnline: users.isOnline,
        })
        .from(friendships)
        .innerJoin(users, eq(users.id, targetUserId))
        .where(
            or(
                and(eq(friendships.senderId, currentUserId), eq(friendships.receiverId, targetUserId)),
                and(eq(friendships.senderId, targetUserId), eq(friendships.receiverId, currentUserId))
            )
        )
        .limit(1);

    if (row.length === 0) {
        throw new AppError(404, "No friendship found with this user");
    }

    const r = row[0];
    const friend: FriendResult = {
        id: r.targetId,
        username: r.targetUsername,
        displayName: r.targetDisplayName,
        avatar: r.targetAvatar,
        isOnline: r.targetIsOnline,
        status: r.status as FriendshipStatus,
        friendshipId: r.friendshipId,
        since: r.createdAt,
    };

    return new ApiResponse("Friendship fetched successfully", friend);
};

export const sendFriendRequest = async (senderId: string, targetUserId: string) => {
    if (senderId === targetUserId) {
        throw new AppError(400, "You cannot send a friend request to yourself");
    }

    const targetUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);

    if (targetUser.length === 0) {
        throw new AppError(404, "User not found");
    }

    const existing = await db
        .select({
            id: friendships.id,
            status: friendships.status,
            senderId: friendships.senderId,
        })
        .from(friendships)
        .where(
            or(
                and(eq(friendships.senderId, senderId), eq(friendships.receiverId, targetUserId)),
                and(eq(friendships.senderId, targetUserId), eq(friendships.receiverId, senderId))
            )
        )
        .limit(1);

    if (existing.length > 0) {
        const rel = existing[0];
        if (rel.status === 'accepted') {
            throw new AppError(409, "You are already friends with this user");
        }
        if (rel.status === 'pending') {
            throw new AppError(409, "A friend request already exists between you and this user");
        }
        if (rel.status === 'blocked') {
            throw new AppError(400, "Cannot send friend request to this user");
        }
    }

    const inserted = await db
        .insert(friendships)
        .values({
            senderId: senderId,
            receiverId: targetUserId,
            status: 'pending',
        })
        .returning({ id: friendships.id });

    return new ApiResponse("Friend request sent", { friendshipId: inserted[0].id });
};

export const acceptFriendRequest = async (currentUserId: string, friendshipId: string) => {
    const row = await db
        .select({
            id: friendships.id,
            senderId: friendships.senderId,
            receiverId: friendships.receiverId,
            status: friendships.status,
        })
        .from(friendships)
        .where(eq(friendships.id, friendshipId))
        .limit(1);

    if (row.length === 0) {
        throw new AppError(404, "Friend request not found");
    }

    const rel = row[0];

    if (rel.receiverId !== currentUserId) {
        throw new AppError(403, "Only the receiver can accept a friend request");
    }

    if (rel.status !== 'pending') {
        throw new AppError(400, "This friend request is no longer pending");
    }

    await db
        .update(friendships)
        .set({ status: 'accepted' })
        .where(eq(friendships.id, friendshipId));

    return new ApiResponse("Friend request accepted", null);
};

export const rejectFriendRequest = async (currentUserId: string, friendshipId: string) => {
    const row = await db
        .select({
            id: friendships.id,
            senderId: friendships.senderId,
            receiverId: friendships.receiverId,
            status: friendships.status,
        })
        .from(friendships)
        .where(eq(friendships.id, friendshipId))
        .limit(1);

    if (row.length === 0) {
        throw new AppError(404, "Friend request not found");
    }

    const rel = row[0];

    if (rel.receiverId !== currentUserId) {
        throw new AppError(403, "Only the receiver can reject a friend request");
    }

    if (rel.status !== 'pending') {
        throw new AppError(400, "This friend request is no longer pending");
    }

    await db
        .delete(friendships)
        .where(eq(friendships.id, friendshipId));

    return new ApiResponse("Friend request rejected", null);
};

export const removeFriend = async (currentUserId: string, friendshipId: string) => {
    const row = await db
        .select({
            id: friendships.id,
            senderId: friendships.senderId,
            receiverId: friendships.receiverId,
        })
        .from(friendships)
        .where(eq(friendships.id, friendshipId))
        .limit(1);

    if (row.length === 0) {
        throw new AppError(404, "Friendship not found");
    }

    const rel = row[0];

    if (rel.senderId !== currentUserId && rel.receiverId !== currentUserId) {
        throw new AppError(404, "Friendship not found");
    }

    await db
        .delete(friendships)
        .where(eq(friendships.id, friendshipId));

    return new ApiResponse("Friend removed", null);
};

export const blockUser = async (currentUserId: string, targetUserId: string) => {
    if (currentUserId === targetUserId) {
        throw new AppError(400, "You cannot block yourself");
    }

    const existing = await db
        .select({
            id: friendships.id,
            status: friendships.status,
            senderId: friendships.senderId,
        })
        .from(friendships)
        .where(
            or(
                and(eq(friendships.senderId, currentUserId), eq(friendships.receiverId, targetUserId)),
                and(eq(friendships.senderId, targetUserId), eq(friendships.receiverId, currentUserId))
            )
        )
        .limit(1);

    if (existing.length > 0) {
        const rel = existing[0];
        if (rel.status === 'blocked' && rel.senderId === currentUserId) {
            throw new AppError(400, "You have already blocked this user");
        }
        await db
            .delete(friendships)
            .where(eq(friendships.id, rel.id));
    }

    await db
        .insert(friendships)
        .values({
            senderId: currentUserId,
            receiverId: targetUserId,
            status: 'blocked',
        });

    return new ApiResponse("User blocked", null);
};

export const unblockUser = async (currentUserId: string, targetUserId: string) => {
    const existing = await db
        .select({
            id: friendships.id,
            status: friendships.status,
            senderId: friendships.senderId,
        })
        .from(friendships)
        .where(
            and(
                eq(friendships.senderId, currentUserId),
                eq(friendships.receiverId, targetUserId),
                eq(friendships.status, 'blocked')
            )
        )
        .limit(1);

    if (existing.length === 0) {
        throw new AppError(404, "No block found for this user");
    }

    await db
        .delete(friendships)
        .where(eq(friendships.id, existing[0].id));

    return new ApiResponse("User unblocked", null);
};
