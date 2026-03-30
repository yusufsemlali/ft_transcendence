import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import * as TournamentService from "@/services/tournament.service";
import { RequestWithContext } from "@/api/types";
import AppError from "@/utils/error";

const s = initServer();

export const tournamentsController = s.router(contract.tournaments, {
    createTournament: async ({ body, req }: { body: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId || contextReq.ctx.decodedToken?.type === "None") {
            throw new AppError(401, "Unauthorized - Please login first");
        }

        const tournament = await TournamentService.createTournament({
            ...body,
            organizerId: userId
        }).catch(() => {
            throw new AppError(400, "Failed to create tournament");
        });

        return {
            status: 201, // Contract specifies 201
            body: {
                ...tournament.data,
                description: tournament.data!.description || undefined,
            } as any, // Cast to any because TS struggles with nullable vs undefined in contracts
        };
    },
    getTournaments: async () => {
        // We'll implement this properly later with a service call
        return {
            status: 200,
            body: [],
        };
    },
});
