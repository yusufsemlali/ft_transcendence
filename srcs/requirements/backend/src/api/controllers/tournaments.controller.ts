import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import * as TournamentService from "@/services/tournament.service";
import { RequestWithContext } from "@/api/types";
import AppError from "@/utils/error";
import { requireOrgRole } from "@/utils/rbac";

const s = initServer();

export const tournamentsController = s.router(contract.tournaments, {
    createTournament: async ({ body, req }: { body: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId || contextReq.ctx.decodedToken?.type === "None") {
            throw new AppError(401, "Unauthorized");
        }

        await requireOrgRole(userId, body.organizationId, ["owner", "admin"]);

        const tournament = await TournamentService.createTournament({
            ...body,
            organizerId: userId
        }).catch((err) => {
            console.error("Tournament creation error:", err);
            throw new AppError(400, "Failed to create tournament");
        });

        return {
            status: 201,
            body: tournament.data as any,
        };
    },
    getTournaments: async () => {
        return {
            status: 200,
            body: [],
        };
    },
});
