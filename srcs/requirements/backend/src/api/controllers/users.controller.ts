import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";

import * as UserService from "@/services/user.service";
import { RequestWithContext } from "@/api/types";
import AppError from "@/utils/error";

const s = initServer();

export const usersController = s.router(contract.users, {
    getMe: async ({ req }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId) {
            return {
                status: 401,
                body: { message: "Unauthorized" },
            };
        }

        try {
            const user = await UserService.getUserById(userId);
            return {
                status: 200,
                body: user,
            };
        } catch (error) {
            return {
                status: 401,
                body: { message: "User not found" },
            };
        }
    },
    updateMe: async ({ body, req }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId) {
            return {
                status: 401, // Schema says 400 for updateMe, but auth failure is 401 ideally. Contract only defined 400.
                body: { message: "Unauthorized" },
            };
        }

        try {
            const updatedUser = await UserService.updateUser(userId, body);
            return {
                status: 200,
                body: updatedUser,
            };
        } catch (error) {
            return {
                status: 400,
                body: { message: "Failed to update profile" },
            };
        }
    },
    getUserById: async ({ params }) => {
        try {
            const user = await UserService.getUserById(params.id);
            return {
                status: 200,
                body: user,
            };
        } catch (error) {
            return {
                status: 404,
                body: { message: "User not found" },
            };
        }
    },
});
