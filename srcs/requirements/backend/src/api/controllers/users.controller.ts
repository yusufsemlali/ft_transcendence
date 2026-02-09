import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";

import * as UserService from "@/services/user.service";
import { RequestWithContext } from "@/api/types";

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
            if (!user) {
                return {
                    status: 401,
                    body: { message: "User not found" },
                };
            }
            return {
                status: 200,
                body: user as any,
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
                status: 401,
                body: { message: "Unauthorized" },
            };
        }

        try {
            const updatedUser = await UserService.updateUser(userId, body);
            if (!updatedUser) {
                return {
                    status: 400,
                    body: { message: "Failed to update profile" },
                };
            }
            return {
                status: 200,
                body: updatedUser as any,
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
            if (!user) {
                return {
                    status: 404,
                    body: { message: "User not found" },
                };
            }
            return {
                status: 200,
                body: user as any,
            };
        } catch (error) {
            return {
                status: 404,
                body: { message: "User not found" },
            };
        }
    },
});
