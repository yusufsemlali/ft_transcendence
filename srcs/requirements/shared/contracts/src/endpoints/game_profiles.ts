import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
    GameProfileSchema,
    CreateGameProfileSchema,
    UpdateGameProfileSchema,
    SupportedGameSchema
} from "../schemas/game_profiles";

const c = initContract();

export const gameProfilesContract = c.router({
    create: {
        method: "POST",
        path: "/game-profiles",
        body: CreateGameProfileSchema,
        responses: {
            201: GameProfileSchema,
            400: z.object({ message: z.string() }),
            409: z.object({ message: z.string() }),
        },
        summary: "Create a new game profile",
    },
    getMyProfiles: {
        method: "GET",
        path: "/game-profiles",
        responses: {
            200: z.array(GameProfileSchema),
        },
        summary: "Get all game profiles for the current user",
    },
    update: {
        method: "PATCH",
        path: "/game-profiles/:game",
        pathParams: z.object({
            game: SupportedGameSchema,
        }),
        body: UpdateGameProfileSchema,
        responses: {
            200: GameProfileSchema,
            404: z.object({ message: z.string() }),
        },
        summary: "Update a specific game profile",
    },
    delete: {
        method: "DELETE",
        path: "/game-profiles/:game",
        pathParams: z.object({
            game: SupportedGameSchema,
        }),
        responses: {
            204: c.noBody(),
            404: z.object({ message: z.string() }),
        },
        summary: "Delete a specific game profile",
    },
    getUserProfiles: {
        method: "GET",
        path: "/users/:userId/game-profiles",
        pathParams: z.object({
            userId: z.string().uuid(),
        }),
        responses: {
            200: z.array(GameProfileSchema),
        },
        summary: "Get game profiles for a specific user",
    },
});
