import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import { db } from "@/dal/db";
import { notifications } from "@/dal/db/schemas/notifications";
import { eq, and, isNull, desc, sql } from "drizzle-orm";
import { RequestWithContext } from "@/api/types";
import AppError from "@/utils/error";

const s = initServer();

function getUserId(req: any): string {
    const contextReq = req as unknown as RequestWithContext;
    const userId = contextReq.ctx.decodedToken?.id;
    if (!userId) throw new AppError(401, "Unauthorized");
    return userId;
}

export const notificationsController = s.router(contract.notifications, {
    getNotifications: async ({ query, req }: { query: any; req: any }) => {
        const userId = getUserId(req);

        const parsedLimit = query?.limit ? parseInt(query.limit, 10) : 50;
        const parsedOffset = query?.offset ? parseInt(query.offset, 10) : 0;
        const limit = Math.min(Math.max(Number.isFinite(parsedLimit) ? parsedLimit : 50, 1), 100);
        const offset = Math.max(Number.isFinite(parsedOffset) ? parsedOffset : 0, 0);

        const conditions = [eq(notifications.userId, userId)];
        if (query?.unread === "true") {
            conditions.push(isNull(notifications.readAt));
        }

        const rows = await db
            .select()
            .from(notifications)
            .where(and(...conditions))
            .orderBy(desc(notifications.createdAt))
            .limit(limit)
            .offset(offset);

        return { status: 200 as const, body: rows as any };
    },

    getUnreadCount: async ({ req }: { req: any }) => {
        const userId = getUserId(req);

        const [result] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(notifications)
            .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

        return { status: 200 as const, body: { count: result?.count ?? 0 } };
    },

    markAsRead: async ({ params, req }: { params: any; req: any }) => {
        const userId = getUserId(req);

        const [updated] = await db
            .update(notifications)
            .set({ readAt: new Date() })
            .where(and(eq(notifications.id, params.id), eq(notifications.userId, userId)))
            .returning({ id: notifications.id });

        if (!updated) throw new AppError(404, "Notification not found");

        return { status: 200 as const, body: { message: "Marked as read" } };
    },

    markAllAsRead: async ({ req }: { req: any }) => {
        const userId = getUserId(req);

        await db
            .update(notifications)
            .set({ readAt: new Date() })
            .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

        return { status: 200 as const, body: { message: "All notifications marked as read" } };
    },
});
