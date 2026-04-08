import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";

import * as UserService from "@/services/user.service";
import { RequestWithContext } from "@/api/types";
import AppError from "@/utils/error";

const s = initServer();

export const usersController = s.router(contract.users, {
    getMe: async ({ req }: { req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId) {
            throw new AppError(401, "Unauthorized");
        }

        const user = await UserService.getUserById(userId).catch(() => {
            throw new AppError(401, "User not found");
        });
        if (!user.data) {
            throw new AppError(401, "User not found");
        }
        return {
            status: 200,
            body: user.data as any,
        };
    },
    updateMe: async ({ body, req }: { body: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId) {
            throw new AppError(401, "Unauthorized");
        }

        const updatedUser = await UserService.updateUser(userId, body).catch(() => {
            throw new AppError(400, "Failed to update profile");
        });
        if (!updatedUser.data) {
            throw new AppError(400, "Failed to update profile");
        }
        return {
            status: 200,
            body: updatedUser.data as any,
        };
    },
    getUserById: async ({ params }: { params: any }) => {
        const user = await UserService.getUserById(params.id).catch(() => {
            throw new AppError(404, "User not found");
        });
        if (!user.data) {
            throw new AppError(404, "User not found");
        }
        return {
            status: 200,
            body: user.data as any,
        };
    },
    changePassword: async ({ body, req }: { body: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId) {
            throw new AppError(401, "Unauthorized");
        }

        await UserService.changePassword(userId, body.currentPassword, body.newPassword);

        return {
            status: 200,
            body: { message: "Password changed successfully" },
        };
    },
    searchUsers: async ({ query, req }: { query: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId) {
            throw new AppError(401, "Unauthorized");
        }

        const result = await UserService.searchUsers(query.q, query.limit ?? 20, userId);
        return {
            status: 200,
            body: result.data as any,
        };
    },
});
