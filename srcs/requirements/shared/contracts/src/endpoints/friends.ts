import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { FriendSchema } from "../schemas/friends";

const c = initContract();

export const friendsContract = c.router({
    getMyFriends: {
        method: "GET",
        path: "/friends",
        query: z.object({
            status: z.enum(['pending', 'accepted', 'blocked']).optional(),
        }).optional(),
        responses: {
            200: z.array(FriendSchema),
            401: z.object({ message: z.string() }),
        },
        summary: "Get the authenticated user's friends list with relationship statuses",
    },
    getFriendship: {
        method: "GET",
        path: "/friends/:userId",
        pathParams: z.object({
            userId: z.string().uuid(),
        }),
        responses: {
            200: FriendSchema,
            401: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Get friendship status with a specific user",
    },
    sendFriendRequest: {
        method: "POST",
        path: "/friends/request",
        body: z.object({
            targetUserId: z.string().uuid(),
        }),
        responses: {
            201: z.object({ message: z.string(), friendshipId: z.string().uuid() }),
            400: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
            409: z.object({ message: z.string() }),
        },
        summary: "Send a friend request to another user",
    },
    acceptFriendRequest: {
        method: "POST",
        path: "/friends/:friendshipId/accept",
        pathParams: z.object({
            friendshipId: z.string().uuid(),
        }),
        body: z.object({}),
        responses: {
            200: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Accept a pending friend request",
    },
    rejectFriendRequest: {
        method: "POST",
        path: "/friends/:friendshipId/reject",
        pathParams: z.object({
            friendshipId: z.string().uuid(),
        }),
        body: z.object({}),
        responses: {
            200: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Reject a pending friend request",
    },
    removeFriend: {
        method: "DELETE",
        path: "/friends/:friendshipId",
        pathParams: z.object({
            friendshipId: z.string().uuid(),
        }),
        responses: {
            200: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Remove an existing friendship",
    },
    blockUser: {
        method: "POST",
        path: "/friends/:userId/block",
        pathParams: z.object({
            userId: z.string().uuid(),
        }),
        body: z.object({}),
        responses: {
            200: z.object({ message: z.string() }),
            400: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
        },
        summary: "Block a user (removes friendship if exists)",
    },
    unblockUser: {
        method: "POST",
        path: "/friends/:userId/unblock",
        pathParams: z.object({
            userId: z.string().uuid(),
        }),
        body: z.object({}),
        responses: {
            200: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Unblock a previously blocked user",
    },
});
