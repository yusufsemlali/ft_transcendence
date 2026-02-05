import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import * as TournamentService from "@/services/tournament.service";

const s = initServer();

export const tournamentsController = s.router(contract.tournaments, {
    createTournament: async ({ body }) => {
        try {
            const tournament = await TournamentService.createTournament({
                ...body,
                organizerId: 1 // TODO: Get from auth middleware later
            });

            return {
                status: 201,
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
