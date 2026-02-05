import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import * as TournamentService from "@/services/tournament.service";
import { RequestWithContext } from "@/api/types";

const s = initServer();

export const tournamentsController = s.router(contract.tournaments, {
    createTournament: async ({ body, req }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx.decodedToken?.id;

        if (!userId || contextReq.ctx.decodedToken?.type === "None") {
            return {
                status: 400, // Contract specifies 400 for errors mostly, 401 might not be in contract yet, but let's conform or add it.
                // Assuming we can return 400 with "Unauthorized" message if 401 isn't in contract, or simply add 401 in contract.
                // For now, let's stick to what's likely safe or 400.
                body: { message: "Unauthorized - Please login first" },
            };
        }

        try {
            const tournament = await TournamentService.createTournament({
                ...body,
                organizerId: userId
            });

            return {
                status: 201, // Contract specifies 201
                body: {
                    ...tournament,
                    description: tournament.description || undefined,
                },
            };
        } catch (error) {
            return {
                status: 400,
                body: { message: "Failed to create tournament" },
            };
        }
    },
    getTournaments: async () => {
        // We'll implement this properly later with a service call
        return {
            status: 200,
            body: [],
        };
    },
});
