import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import * as SettingsService from "@/services/settings.service";
import { RequestWithContext } from "@/api/types";

const s = initServer();

export const settingsController = s.router(contract.settings, {
    getSettings: async ({ req }: { req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId || contextReq.ctx.decodedToken?.type === "None") {
            return {
                status: 401,
                body: { message: "Unauthorized" },
            };
        }

        try {
            const settings = await SettingsService.getSettings(userId);
            return {
                status: 200,
                body: settings,
            };
        } catch (error) {
            return {
                status: 401,
                body: { message: "Failed to get settings" },
            };
        }
    },

    updateSettings: async ({ body, req }: { body: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId || contextReq.ctx.decodedToken?.type === "None") {
            return {
                status: 401,
                body: { message: "Unauthorized" },
            };
        }

        try {
            const settings = await SettingsService.updateSettings(userId, body);
            return {
                status: 200,
                body: settings,
            };
        } catch (error) {
            return {
                status: 400,
                body: { message: "Failed to update settings" },
            };
        }
    },

    resetSettings: async ({ req }: { req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId || contextReq.ctx.decodedToken?.type === "None") {
            return {
                status: 401,
                body: { message: "Unauthorized" },
            };
        }

        try {
            const settings = await SettingsService.resetSettings(userId);
            return {
                status: 200,
                body: settings,
            };
        } catch (error) {
            return {
                status: 401,
                body: { message: "Failed to reset settings" },
            };
        }
    },
});
