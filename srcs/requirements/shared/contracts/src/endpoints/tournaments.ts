import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { TournamentSchema, CreateTournamentSchema } from "../schemas/tournaments";

const c = initContract();

export const tournamentsContract = c.router({
    createTournament: {
        method: "POST",
        path: "/tournaments",
        responses: {
            201: TournamentSchema,
            400: z.object({ message: z.string() }),
        },
        body: CreateTournamentSchema,
        summary: "Create a new tournament",
    },
    getTournaments: {
        method: "GET",
        path: "/tournaments",
        responses: {
            200: z.array(TournamentSchema),
        },
        summary: "Get all tournaments",
    },
});
