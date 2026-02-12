import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import * as GameProfileService from "@/services/game-profile.service";
import { RequestWithContext } from "@/api/types";
import AppError from "@/utils/error";

const s = initServer();

export const gameProfilesController = s.router(contract.gameProfiles, {
    create: async ({ body, req }: { body: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId) {
            return {
                status: 401, // Not defined in contract but usually handled by middleware
                body: { message: "Unauthorized" },
            } as any;
        }

        try {
            const profile = await GameProfileService.createGameProfile(
                userId,
                body.game,
                body.gameIdentifier,
                body.metadata
            );

            return {
                status: 201,
                body: profile,
            };
        } catch (error: any) {
            if (error instanceof AppError) {
                if (error.status === 409) {
                    return {
                        status: 409,
                        body: { message: error.message },
                    };
                }
            }
            return {
                status: 400,
                body: { message: "Failed to create profile" },
            };
        }
    },
    getMyProfiles: async ({ req }: { req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId) {
            return {
                status: 401,
                body: { message: "Unauthorized" },
            } as any;
        }

        const profiles = await GameProfileService.getUserGameProfiles(userId);
        return {
            status: 200,
            body: profiles,
        };
    },
    update: async ({ params, body, req }: { params: any; body: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId) {
            return {
                status: 401,
                body: { message: "Unauthorized" },
            } as any;
        }

        try {
            const updated = await GameProfileService.updateGameProfile(
                userId,
                params.game,
                body
            );
            return {
                status: 200,
                body: updated,
            };
        } catch (error) {
            return {
                status: 404,
                body: { message: "Profile not found" },
            };
        }
    },
    delete: async ({ params, req }: { params: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId) {
            return {
                status: 401,
                body: { message: "Unauthorized" },
            } as any;
        }

        try {
            await GameProfileService.deleteGameProfile(userId, params.game);
            return {
                status: 204,
                body: null,
            };
        } catch (error) {
            return {
                status: 404,
                body: { message: "Profile not found" },
            };
        }
    },
    getUserProfiles: async ({ params }: { params: any }) => {
        const profiles = await GameProfileService.getUserGameProfiles(params.userId);
        const visibleProfiles = profiles.filter(p => p.isVisible);

        return {
            status: 200,
            body: visibleProfiles as any,
        };
    },
});
