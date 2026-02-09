import { initContract } from "@ts-rest/core";
import { UserSchema, UpdateUserSchema } from "../schemas/users";
import { z } from "zod";

const c = initContract();

export const usersContract = c.router({
    getMe: {
        method: "GET",
        path: "/users/me",
        responses: {
            200: UserSchema,
            401: z.object({ message: z.string() }),
        },
        summary: "Get currently authenticated user",
    },
    updateMe: {
        method: "PATCH",
        path: "/users/me",
        body: UpdateUserSchema,
        responses: {
            200: UserSchema,
            400: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
        },
        summary: "Update current user profile",
    },
    getUserById: {
        method: "GET",
        path: "/users/:id",
        pathParams: z.object({
            id: z.string().uuid(),
        }),
        responses: {
            200: UserSchema,
            404: z.object({ message: z.string() }),
        },
        summary: "Get a user by ID",
    },
});
