import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
    HandleSchema,
    CreateHandleSchema,
    UpdateHandleSchema,
    LinkedAccountSchema
} from "../schemas/handles";

const c = initContract();

/**
 * Handles are Game Identifiers (like Riot ID, Steam ID)
 * Linked Accounts are Social/Auth Identifiers (like 42, Discord)
 */
export const handlesContract = c.router({
    // --- Handles (Game Accounts) ---
    create: {
        method: "POST",
        path: "/users/me/handles",
        body: CreateHandleSchema,
        responses: {
            201: HandleSchema,
            400: z.object({ message: z.string() }),
            409: z.object({ message: z.string() }),
        },
        summary: "Link a new game handle (Riot, Steam, etc.)",
    },
    getMyHandles: {
        method: "GET",
        path: "/users/me/handles",
        responses: {
            200: z.array(HandleSchema),
        },
        summary: "Get all game handles for the current user",
    },
    update: {
        method: "PATCH",
        path: "/users/me/handles/:id",
        pathParams: z.object({ id: z.string().uuid() }),
        body: UpdateHandleSchema,
        responses: {
            200: HandleSchema,
            404: z.object({ message: z.string() }),
        },
        summary: "Update the metadata of a specific handle",
    },
    delete: {
        method: "DELETE",
        path: "/users/me/handles/:id",
        pathParams: z.object({ id: z.string().uuid() }),
        responses: {
            204: c.noBody(),
            404: z.object({ message: z.string() }),
        },
        summary: "Unlink a specific game handle",
    },

    // --- Linked Accounts (Auth Providers) ---
    getIdentities: {
        method: "GET",
        path: "/users/me/identities",
        responses: {
            200: z.array(LinkedAccountSchema),
        },
        summary: "List all linked social/auth accounts (42, Discord, Google)",
    },
    deleteIdentity: {
        method: "DELETE",
        path: "/users/me/identities/:id",
        pathParams: z.object({ id: z.string().uuid() }),
        responses: {
            204: c.noBody(),
            404: z.object({ message: z.string() }),
        },
        summary: "Unlink a specific social/auth account",
    },

    // --- Public / Profile Handles ---
    getUserHandles: {
        method: "GET",
        path: "/users/:userId/handles",
        pathParams: z.object({
            userId: z.string().uuid(),
        }),
        responses: {
            200: z.array(HandleSchema),
        },
        summary: "Get public game handles for a specific user",
    },
});
