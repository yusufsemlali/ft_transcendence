import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import { db } from "@/dal/db";
import { users } from "@/dal/db/schemas/users";
import { eq, ilike, or, and, sql, desc } from "drizzle-orm";
import { RequestWithContext } from "@/api/types";
import AppError from "@/utils/error";
import { requireGlobalRole } from "@/utils/rbac";
import { ApiResponse } from "@/utils/response";

const s = initServer();

export const adminController = s.router(contract.admin, {
    getUsers: async ({ query, req }: { query: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;

        if (!userId) throw new AppError(401, "Unauthorized");

        // 🛡️ High Security Check: Must be Admin to list all users
        await requireGlobalRole(userId, ["admin"]);

        const { page, pageSize, search, role, status } = query;
        const offset = (page - 1) * pageSize;

        // Build Filters
        const filters = [];
        if (search) {
            filters.push(or(
                ilike(users.username, `%${search}%`),
                ilike(users.email, `%${search}%`),
                ilike(users.displayName, `%${search}%`)
            ));
        }
        if (role) filters.push(eq(users.role, role));
        if (status) filters.push(eq(users.status, status));

        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        // 1. Fetch Users
        const usersList = await db
            .select()
            .from(users)
            .where(whereClause)
            .limit(pageSize)
            .offset(offset)
            .orderBy(desc(users.createdAt));

        // 2. Fetch Total Count
        const [totalCount] = await db
            .select({ value: sql`count(*)`.mapWith(Number) })
            .from(users)
            .where(whereClause);

        const total = totalCount?.value || 0;

        return {
            status: 200,
            body: {
                users: usersList as any,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    },
    getUserById: async ({ params, req }: { params: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;

        if (!userId) throw new AppError(401, "Unauthorized");

        // 🛡️ High Security Check: Admins and Moderators can view full details
        await requireGlobalRole(userId, ["admin", "moderator"]);

        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, params.id));

        if (!user) throw new AppError(404, "User not found");

        return {
            status: 200,
            body: user as any,
        };
    },
    updateUserRole: async ({ params, body, req }: { params: any; body: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;

        if (!userId) throw new AppError(401, "Unauthorized");

        // 🛡️ High Security Check: Only Admins can promote/demote others
        await requireGlobalRole(userId, ["admin"]);

        const [updated] = await db
            .update(users)
            .set({ 
                role: body.role,
                updatedAt: new Date() 
            })
            .where(eq(users.id, params.id))
            .returning();

        if (!updated) throw new AppError(404, "User not found");

        return {
            status: 200,
            body: updated as any,
        };
    },
    updateUserStatus: async ({ params, body, req }: { params: any; body: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;

        if (!userId) throw new AppError(401, "Unauthorized");

        // 🛡️ High Security Check: Admins and Moderators can manage status
        await requireGlobalRole(userId, ["admin", "moderator"]);

        const [updated] = await db
            .update(users)
            .set({ 
                status: body.status,
                banReason: body.reason || null,
                bannedUntil: body.until || null,
                updatedAt: new Date()
            })
            .where(eq(users.id, params.id))
            .returning();

        if (!updated) throw new AppError(404, "User not found");

        return {
            status: 200,
            body: updated as any,
        };
    },
});
