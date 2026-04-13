import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import { RequestWithContext } from "@/api/types";
import AppError from "@/utils/error";
import { GdprService } from "@/services/gdpr.service";

const s = initServer();

export const gdprController = s.router(contract.gdpr, {
    exportMyData: async ({ req }: { req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        const data = await GdprService.exportUserData(userId);
        return { status: 200, body: data as any };
    },

    exportMyDataCsv: async ({ req }: { req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        const data = await GdprService.exportUserData(userId);
        const csv = GdprService.dataToCsv(data);

        const rawRes = (req as any).res;
        if (rawRes) {
            rawRes.setHeader("Content-Type", "text/csv");
            rawRes.setHeader("Content-Disposition", `attachment; filename="gdpr-export-${Date.now()}.csv"`);
        }

        return { status: 200, body: csv as any };
    },

    requestDataDeletion: async ({ body, req }: { body: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        if (body.confirmation !== "DELETE MY ACCOUNT") {
            throw new AppError(400, "You must type 'DELETE MY ACCOUNT' to confirm.");
        }

        const result = await GdprService.deleteAccount(userId);
        return { status: 200, body: result };
    },
});
