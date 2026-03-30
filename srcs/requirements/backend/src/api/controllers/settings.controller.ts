import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import * as SettingsService from "@/services/settings.service";
import { RequestWithContext } from "@/api/types";
import AppError from "@/utils/error";

const s = initServer();

export const settingsController = s.router(contract.settings, {
    getSettings: async ({ req }: { req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId || contextReq.ctx.decodedToken?.type === "None") {
            throw new AppError(401, "Unauthorized");
        }

        const settings = await SettingsService.getSettings(userId).catch(() => {
            throw new AppError(401, "Failed to get settings");
        });
        return {
            status: 200,
            body: settings.data!,
        };
    },

    updateSettings: async ({ body, req }: { body: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId || contextReq.ctx.decodedToken?.type === "None") {
            throw new AppError(401, "Unauthorized");
        }

        const settings = await SettingsService.updateSettings(userId, body).catch(() => {
            throw new AppError(400, "Failed to update settings");
        });
        return {
            status: 200,
            body: settings.data!,
        };
    },

    resetSettings: async ({ req }: { req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId || contextReq.ctx.decodedToken?.type === "None") {
            throw new AppError(401, "Unauthorized");
        }

        const settings = await SettingsService.resetSettings(userId).catch(() => {
            throw new AppError(401, "Failed to reset settings");
        });
        return {
            status: 200,
            body: settings.data!,
        };
    },
});
