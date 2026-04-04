import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { UserSchema, UserRoleSchema, UserStatusSchema } from "../schemas/users";
import { SessionSchema } from "../schemas/auth";

const c = initContract();

export const adminContract = c.router({
    getUsers: {
        method: "GET",
        path: "/admin/users",
        query: z.object({
            page: z.coerce.number().default(1),
            pageSize: z.coerce.number().default(20),
            search: z.string().optional(),
            role: UserRoleSchema.optional(),
            status: UserStatusSchema.optional(),
        }),
        responses: {
            200: z.object({
                users: z.array(UserSchema),
                total: z.number(),
                page: z.number(),
                pageSize: z.number(),
                totalPages: z.number(),
            }),
            401: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
        },
        summary: "List all users on the platform (Requires: Admin)",
    },
    getUserById: {
        method: "GET",
        path: "/admin/users/:id",
        pathParams: z.object({ id: z.string().uuid() }),
        responses: {
            200: UserSchema,
            401: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Get a detailed user profile for management (Requires: Admin/Moderator)",
    },
    updateUserRole: {
        method: "PATCH",
        path: "/admin/users/:id/role",
        pathParams: z.object({ id: z.string().uuid() }),
        body: z.object({
            role: UserRoleSchema,
        }),
        responses: {
            200: UserSchema,
            401: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Update user's global platform role (Requires: Admin)",
    },
    updateUserStatus: {
        method: "PATCH",
        path: "/admin/users/:id/status",
        pathParams: z.object({ id: z.string().uuid() }),
        body: z.object({
            status: UserStatusSchema,
            reason: z.string().optional(),
            until: z.coerce.date().optional(),
        }),
        responses: {
            200: UserSchema,
            401: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Ban, suspend, or mute a user (Requires: Admin/Moderator)",
    },
    deleteUser: {
        method: "DELETE",
        path: "/admin/users/:id",
        pathParams: z.object({ id: z.string().uuid() }),
        body: z.object({}),
        responses: {
            200: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Permanently delete a user (Requires: Admin)",
    },
    getUserSessions: {
        method: "GET",
        path: "/admin/users/:id/sessions",
        pathParams: z.object({ id: z.string().uuid() }),
        responses: {
            200: z.array(SessionSchema),
            401: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "List all active sessions for a specific user (Requires: Admin/Moderator)",
    },
    revokeUserSession: {
        method: "DELETE",
        path: "/admin/users/:id/sessions/:sessionId",
        pathParams: z.object({
            id: z.string().uuid(),
            sessionId: z.string().uuid(),
        }),
        body: z.object({}),
        responses: {
            200: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
        },
        summary: "Force logout a specific session for a user (Requires: Admin)",
    },
    revokeAllUserSessions: {
        method: "DELETE",
        path: "/admin/users/:id/sessions",
        pathParams: z.object({ id: z.string().uuid() }),
        body: z.object({}),
        responses: {
            200: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
        },
        summary: "Force logout ALL active sessions for a user (Requires: Admin)",
    },
});
