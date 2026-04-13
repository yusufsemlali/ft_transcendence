import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

export const gdprContract = c.router({
    exportMyData: {
        method: "GET",
        path: "/gdpr/export",
        responses: {
            200: z.object({
                user: z.any(),
                settings: z.any(),
                friends: z.array(z.any()),
                organizations: z.array(z.any()),
                files: z.array(z.any()),
                chatMessages: z.array(z.any()),
                notifications: z.array(z.any()),
                exportedAt: z.string(),
            }),
            401: z.object({ message: z.string() }),
        },
        summary: "Export all personal data (GDPR data portability)",
    },
    exportMyDataCsv: {
        method: "GET",
        path: "/gdpr/export/csv",
        responses: {
            200: z.any(),
            401: z.object({ message: z.string() }),
        },
        summary: "Export personal data as CSV",
    },
    requestDataDeletion: {
        method: "POST",
        path: "/gdpr/delete-account",
        body: z.object({
            confirmation: z.literal("DELETE MY ACCOUNT"),
        }),
        responses: {
            200: z.object({ message: z.string() }),
            400: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
        },
        summary: "Request account deletion with confirmation (GDPR right to erasure)",
    },
});
