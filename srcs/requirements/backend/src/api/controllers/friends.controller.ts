import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import * as FriendsService from "@/services/friends.service";
import { RequestWithContext } from "@/api/types";
import AppError from "@/utils/error";

const s = initServer();

function getUserId(req: any): string {
    const contextReq = req as unknown as RequestWithContext;
    const userId = contextReq.ctx.decodedToken?.id;
    if (!userId) {
        throw new AppError(401, "Unauthorized");
    }
    return userId;
}

export const friendsController = s.router(contract.friends, {
    getMyFriends: async ({ query, req }: { query: any; req: any }) => {
        const userId = getUserId(req);
        const statusFilter = query?.status;
        const friends = await FriendsService.getMyFriends(userId, statusFilter);

        return {
            status: 200 as const,
            body: friends.data as any,
        };
    },
    getFriendship: async ({ params, req }: { params: any; req: any }) => {
        const userId = getUserId(req);
        const friendship = await FriendsService.getFriendship(userId, params.userId);

        return {
            status: 200 as const,
            body: friendship.data as any,
        };
    },
    sendFriendRequest: async ({ body, req }: { body: any; req: any }) => {
        const userId = getUserId(req);
        const result = await FriendsService.sendFriendRequest(userId, body.targetUserId);

        return {
            status: 201 as const,
            body: {
                message: result.message,
                friendshipId: result.data!.friendshipId,
            },
        };
    },
    acceptFriendRequest: async ({ params, req }: { params: any; req: any }) => {
        const userId = getUserId(req);
        const result = await FriendsService.acceptFriendRequest(userId, params.friendshipId);

        return {
            status: 200 as const,
            body: { message: result.message },
        };
    },
    rejectFriendRequest: async ({ params, req }: { params: any; req: any }) => {
        const userId = getUserId(req);
        const result = await FriendsService.rejectFriendRequest(userId, params.friendshipId);

        return {
            status: 200 as const,
            body: { message: result.message },
        };
    },
    removeFriend: async ({ params, req }: { params: any; req: any }) => {
        const userId = getUserId(req);
        const result = await FriendsService.removeFriend(userId, params.friendshipId);

        return {
            status: 200 as const,
            body: { message: result.message },
        };
    },
    blockUser: async ({ params, req }: { params: any; req: any }) => {
        const userId = getUserId(req);
        const result = await FriendsService.blockUser(userId, params.userId);

        return {
            status: 200 as const,
            body: { message: result.message },
        };
    },
    unblockUser: async ({ params, req }: { params: any; req: any }) => {
        const userId = getUserId(req);
        const result = await FriendsService.unblockUser(userId, params.userId);

        return {
            status: 200 as const,
            body: { message: result.message },
        };
    },
});
