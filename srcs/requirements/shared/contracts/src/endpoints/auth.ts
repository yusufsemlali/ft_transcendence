import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { RegisterInputSchema, LoginInputSchema, AuthResponseSchema } from "../schemas/auth";

const c = initContract();

export const authContract = c.router({
    register: {
        method: "POST",
        path: "/auth/register",
        body: RegisterInputSchema,
        responses: {
            201: AuthResponseSchema,
            400: z.object({ message: z.string() }),
            409: z.object({ message: z.string() }),
        },
        summary: "Register a new user",
    },
    login: {
        method: "POST",
        path: "/auth/login",
        body: LoginInputSchema,
        responses: {
            200: AuthResponseSchema,
            401: z.object({ message: z.string() }),
        },
        summary: "Login with email and password",
    },
});
