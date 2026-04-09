import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { NotificationSchema } from "../schemas/notifications";

const c = initContract();

export const notificationsContract = c.router({
    getNotifications: {
        method: "GET",
        path: "/notifications",
        query: z.object({
            unread: z.string().optional(),
            limit: z.string().optional(),
            offset: z.string().optional(),
        }).optional(),
        responses: {
            200: z.array(NotificationSchema),
            401: z.object({ message: z.string() }),
        },
        summary: "List notifications for the authenticated user",
    },
    getUnreadCount: {
        method: "GET",
        path: "/notifications/unread-count",
        responses: {
            200: z.object({ count: z.number() }),
            401: z.object({ message: z.string() }),
        },
        summary: "Get the unread notification count for the bell badge",
    },
    markAsRead: {
        method: "POST",
        path: "/notifications/:id/read",
        pathParams: z.object({
            id: z.string().uuid(),
        }),
        body: z.object({}),
        responses: {
            200: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Mark a single notification as read",
    },
    markAllAsRead: {
        method: "POST",
        path: "/notifications/read-all",
        body: z.object({}),
        responses: {
            200: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
        },
        summary: "Mark all notifications as read for the authenticated user",
    },
});
