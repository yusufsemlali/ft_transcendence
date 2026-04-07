import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { SPORT_MODES, SCORING_TYPES, SPORT_CATEGORIES } from "../constants/sports";

const c = initContract();

export const SportSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    category: z.enum(SPORT_CATEGORIES),
    
    // --- IMMUTABLE Blueprints ---
    scoringType: z.enum(SCORING_TYPES),
    mode: z.enum(SPORT_MODES),
    requiredHandleType: z.string().nullable(),

    // --- OVERRIDABLE Defaults ---
    defaultMinTeamSize: z.number().int().min(1).nullable(),
    defaultMaxTeamSize: z.number().int().min(1).nullable(),
    defaultHasDraws: z.boolean(),

    // --- ENGINE SCHEMAS ---
    tournamentConfigSchema: z.record(z.any()).nullable(),
    matchConfigSchema: z.record(z.any()).nullable(),

    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

export type Sport = z.infer<typeof SportSchema>;

export const CreateSportSchema = SportSchema.omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true 
});

export const UpdateSportSchema = CreateSportSchema.partial();

export const sportsContract = c.router({
    getSports: {
        method: "GET",
        path: "/sports",
        responses: {
            200: z.array(SportSchema),
        },
        summary: "Get a list of all supported sports/games on the platform",
    },
    getSport: {
        method: "GET",
        path: "/sports/:id",
        pathParams: z.object({ id: z.string().uuid() }),
        responses: {
            200: SportSchema,
            404: z.object({ message: z.string() }),
        },
        summary: "Get a specific sport blueprint",
    },
    create: {
        method: "POST",
        path: "/sports",
        body: CreateSportSchema,
        responses: {
            201: SportSchema,
            400: z.object({ message: z.string() }),
            409: z.object({ message: z.string() }),
        },
        summary: "Add a new sport blueprint (Admin only)",
    },
    update: {
        method: "PATCH",
        path: "/sports/:id",
        pathParams: z.object({ id: z.string().uuid() }),
        body: UpdateSportSchema,
        responses: {
            200: SportSchema,
            404: z.object({ message: z.string() }),
        },
        summary: "Update a sport blueprint (Admin only)",
    },
    delete: {
        method: "DELETE",
        path: "/sports/:id",
        pathParams: z.object({ id: z.string().uuid() }),
        responses: {
            204: c.noBody(),
            404: z.object({ message: z.string() }),
        },
        summary: "Delete a sport blueprint (Admin only)",
    },
});
