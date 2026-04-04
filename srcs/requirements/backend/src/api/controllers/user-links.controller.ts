import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import * as UserLinksService from "@/services/user-links.service";
import { RequestWithContext } from "@/api/types";
import AppError from "@/utils/error";

const s = initServer();

export const userLinksController = s.router(contract.handles, {
    // --- Handles (Game Profiles) ---
    create: async ({ body, req }: { body: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId) throw new AppError(401, "Unauthorized");

        const profile = await UserLinksService.createHandle(
            userId,
            body.sportId,
            body.handle,
            body.metadata
        );

        return {
            status: 201,
            body: profile.data as any,
        };
    },
    getMyHandles: async ({ req }: { req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId) throw new AppError(401, "Unauthorized");

        const handles = await UserLinksService.getUserHandles(userId);
        return {
            status: 200,
            body: handles.data as any,
        };
    },
    update: async ({ params, body, req }: { params: any; body: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId) throw new AppError(401, "Unauthorized");

        const updated = await UserLinksService.updateHandle(
            userId,
            params.id,
            body
        );
        
        return {
            status: 200,
            body: updated.data as any,
        };
    },
    delete: async ({ params, req }: { params: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId) throw new AppError(401, "Unauthorized");

        await UserLinksService.deleteHandle(userId, params.id);
        
        return {
            status: 204,
            body: undefined,
        };
    },

    // --- Linked Accounts (Auth Providers) ---
    getIdentities: async ({ req }: { req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId) throw new AppError(401, "Unauthorized");

        const accounts = await UserLinksService.getLinkedAccounts(userId);
        return {
            status: 200,
            body: accounts.data as any,
        };
    },
    deleteIdentity: async ({ params, req }: { params: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId) throw new AppError(401, "Unauthorized");

        await UserLinksService.deleteLinkedAccount(userId, params.id);
        
        return {
            status: 204,
            body: undefined,
        };
    },

    getUserHandles: async ({ params }) => {
        const handles = await UserLinksService.getUserHandles(params.userId);
        return {
            status: 200,
            body: handles.data as any,
        };
    },
});
