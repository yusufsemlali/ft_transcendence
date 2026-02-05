import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { UserSettingsSchema, PartialUserSettingsSchema } from "../schemas/settings";

const c = initContract();

export const settingsContract = c.router({
    getSettings: {
        method: "GET",
        path: "/settings",
        responses: {
            200: UserSettingsSchema,
            401: z.object({ message: z.string() }),
        },
        summary: "Get current user settings",
    },
    updateSettings: {
        method: "PATCH",
        path: "/settings",
        body: PartialUserSettingsSchema,
        responses: {
            200: UserSettingsSchema,
            400: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
        },
        summary: "Update user settings",
    },
    resetSettings: {
        method: "POST",
        path: "/settings/reset",
        body: z.object({}),
        responses: {
            200: UserSettingsSchema,
            401: z.object({ message: z.string() }),
        },
        summary: "Reset settings to defaults",
    },
});
