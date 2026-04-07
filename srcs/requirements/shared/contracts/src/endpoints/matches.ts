import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { MatchSchema, UpdateMatchSchema } from "../schemas/matches";

const c = initContract();

export const matchesContract = c.router({
    getMatchById: {
        method: "GET",
        path: "/matches/:id",
        pathParams: z.object({ id: z.string().uuid() }),
        responses: {
            200: MatchSchema,
            404: z.object({ message: z.string() }),
        },
        summary: "Get specific match details",
    },
    updateMatch: {
        method: "PATCH",
        path: "/matches/:id",
        pathParams: z.object({ id: z.string().uuid() }),
        body: UpdateMatchSchema,
        responses: {
            200: z.object({ message: z.string(), data: MatchSchema }),
            400: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Update match results or config overrides",
    },
    listTournamentMatches: {
        method: "GET",
        path: "/tournaments/:tournamentId/matches",
        pathParams: z.object({ tournamentId: z.string().uuid() }),
        responses: {
            200: z.array(MatchSchema),
        },
        summary: "List all matches in a tournament",
    }
});
