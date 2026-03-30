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
            throw new AppError(401, "Unauthorized");
        }
        const profile = await GameProfileService.createGameProfile(
            userId,
            body.game,
            body.gameIdentifier,
            body.metadata
        ).catch((err: any) => {
            if (err instanceof AppError && err.status === 409) throw err;
            throw new AppError(400, "Failed to create profile");
        });

        return {
            status: 201,
            body: profile.data as any,
        };
    },
    getMyProfiles: async ({ req }: { req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId) {
            throw new AppError(401, "Unauthorized");
        }

        const profiles = await GameProfileService.getUserGameProfiles(userId);
        return {
            status: 200,
            body: profiles.data as any,
        };
    },
    update: async ({ params, body, req }: { params: any; body: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId) {
            throw new AppError(401, "Unauthorized");
        }
        const updated = await GameProfileService.updateGameProfile(
            userId,
            params.game,
            body
        ).catch(() => {
            throw new AppError(404, "Profile not found");
        });
        
        return {
            status: 200,
            body: updated.data as any,
        };
    },
    delete: async ({ params, req }: { params: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId) {
            throw new AppError(401, "Unauthorized");
        }
        await GameProfileService.deleteGameProfile(userId, params.game).catch(() => {
            throw new AppError(404, "Profile not found");
        });
        
        return {
            status: 204,
            body: undefined,
        };
    },
    getUserProfiles: async ({ params }: { params: any }) => {
        const profiles = await GameProfileService.getUserGameProfiles(params.userId);
        const visibleProfiles = profiles.data!.filter(p => p.isVisible);

        return {
            status: 200,
            body: visibleProfiles as any,
        };
    },
});
