import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { MatchSchema, AdminMatchUpdateSchema } from "../schemas/matches";
import {
    BracketStateSchema,
    PatchMatchScoresSchema,
    FinalizeMatchSchema,
    StandingsEntrySchema,
} from "../schemas/bracket";

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
        body: AdminMatchUpdateSchema,
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
    },
    getBracketState: {
        method: "GET",
        path: "/tournaments/:tournamentId/bracket",
        pathParams: z.object({ tournamentId: z.string().uuid() }),
        responses: {
            200: BracketStateSchema,
            404: z.object({ message: z.string() }),
        },
        summary: "Get the full structured bracket state for a tournament",
    },
    generateBracket: {
        method: "POST",
        path: "/tournaments/:tournamentId/bracket/generate",
        pathParams: z.object({ tournamentId: z.string().uuid() }),
        body: z.object({}).optional(),
        responses: {
            201: z.object({ message: z.string(), data: BracketStateSchema }),
            400: z.object({ message: z.string() }),
            409: z.object({ message: z.string() }),
        },
        summary: "Generate the bracket for a tournament (TO action)",
    },
    resetBracket: {
        method: "DELETE",
        path: "/tournaments/:tournamentId/bracket",
        pathParams: z.object({ tournamentId: z.string().uuid() }),
        responses: {
            200: z.object({ message: z.string() }),
            400: z.object({ message: z.string() }),
            409: z.object({ message: z.string() }),
        },
        summary: "Delete all matches and reset the bracket (TO action)",
    },
    reportScore: {
        method: "POST",
        path: "/matches/:id/report",
        pathParams: z.object({ id: z.string().uuid() }),
        body: PatchMatchScoresSchema,
        responses: {
            200: z.object({ message: z.string(), data: MatchSchema }),
            400: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
            409: z.object({ message: z.string() }),
        },
        summary: "Update match scores only (does not complete the match or advance the bracket)",
    },
    finalizeMatch: {
        method: "POST",
        path: "/matches/:id/finalize",
        pathParams: z.object({ id: z.string().uuid() }),
        body: FinalizeMatchSchema,
        responses: {
            200: z.object({ message: z.string(), data: MatchSchema }),
            400: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
            409: z.object({ message: z.string() }),
        },
        summary: "Finalize match result: complete, advance winner, elimination side-effects",
    },
    getStandings: {
        method: "GET",
        path: "/tournaments/:tournamentId/standings",
        pathParams: z.object({ tournamentId: z.string().uuid() }),
        responses: {
            200: z.array(StandingsEntrySchema),
            404: z.object({ message: z.string() }),
        },
        summary: "Get computed standings for a tournament",
    },
    advanceSwissRound: {
        method: "POST",
        path: "/tournaments/:tournamentId/bracket/advance-swiss",
        pathParams: z.object({ tournamentId: z.string().uuid() }),
        body: z.object({}).optional(),
        responses: {
            201: z.object({ message: z.string(), round: z.number().int() }),
            400: z.object({ message: z.string() }),
            409: z.object({ message: z.string() }),
        },
        summary: "Generate the next Swiss round pairings after current round completes",
    },
});
