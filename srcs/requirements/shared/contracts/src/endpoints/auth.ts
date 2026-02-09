import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
    RegisterInputSchema,
    LoginInputSchema,
    AuthResponseSchema,
    RefreshResponseSchema,
    LogoutResponseSchema,
    LogoutAllResponseSchema,
    SessionsResponseSchema,
} from "../schemas/auth";

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
    refresh: {
        method: "POST",
        path: "/auth/refresh",
        body: z.object({}), // No body needed, refresh token is in cookie
        responses: {
            200: RefreshResponseSchema,
            401: z.object({ message: z.string() }),
        },
        summary: "Refresh access token using refresh token cookie",
    },
    logout: {
        method: "POST",
        path: "/auth/logout",
        body: z.object({}),
        responses: {
            200: LogoutResponseSchema,
            401: z.object({ message: z.string() }),
        },
        summary: "Logout current session",
    },
    logoutAll: {
        method: "POST",
        path: "/auth/logout-all",
        body: z.object({}),
        responses: {
            200: LogoutAllResponseSchema,
            401: z.object({ message: z.string() }),
        },
        summary: "Logout all sessions for current user",
    },
    sessions: {
        method: "GET",
        path: "/auth/sessions",
        responses: {
            200: SessionsResponseSchema,
            401: z.object({ message: z.string() }),
        },
        summary: "Get all active sessions for current user",
    },
});
