import fs from "fs/promises";
import path from "path";
import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import { db } from "@/dal/db";
import { users } from "@/dal/db/schemas/users";
import { files } from "@/dal/db/schemas/files";
import { invites } from "@/dal/db/schemas/lobby";
import { organizations } from "@/dal/db/schemas/organizations";
import { tournaments } from "@/dal/db/schemas/tournaments";
import { eq, ilike, or, and, sql, desc, isNull } from "drizzle-orm";
import { RequestWithContext } from "@/api/types";
import AppError from "@/utils/error";
import { requireGlobalRole, ensureNotLastAdmin } from "@/utils/rbac";
import { logout, logoutAll, getActiveSessions } from "@/services/auth.service";
import { FileService } from "@/services/file.service";

const s = initServer();

export const adminController = s.router(contract.admin, {
    getUsers: async ({ query, req }: { query: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;

        if (!userId) throw new AppError(401, "Unauthorized");

        await requireGlobalRole(userId, ["admin"]);

        const { page, pageSize, search, role, status } = query;
        const offset = (page - 1) * pageSize;

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
        const adminId = contextReq.ctx?.decodedToken?.id;

        if (!adminId) throw new AppError(401, "Unauthorized");

        // 🛡️ High Security Check: Only Admins can promote/demote others
        await requireGlobalRole(adminId, ["admin"]);

        // 🛡️ Safeguard 1: Prevent self-demotion/role change
        if (adminId === params.id && body.role !== "admin") {
            throw new AppError(400, "For forensic and audit integrity, admins cannot change their own privileges. Please have another admin perform this action.");
        }

        // 🛡️ Safeguard 2: Prevent the "Last Admin" deadlock
        if (body.role !== "admin") {
            await ensureNotLastAdmin(params.id);
        }

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
        const adminId = contextReq.ctx?.decodedToken?.id;

        if (!adminId) throw new AppError(401, "Unauthorized");

        // 🛡️ High Security Check: Admins and Moderators can manage status
        await requireGlobalRole(adminId, ["admin", "moderator"]);

        // 🛡️ Safeguard 1: Prevent self-lockout (Ban/Suspend/Mute)
        if (adminId === params.id && body.status !== "active") {
            throw new AppError(400, "For operational safety, you cannot suspend or ban your own account. This action must be performed by a peer.");
        }

        // 🛡️ Safeguard 2: Prevent the "Last Admin" deadlock if suspending an admin
        if (body.status !== "active") {
            await ensureNotLastAdmin(params.id);
        }

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
    deleteUser: async ({ params, req }: { params: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const adminId = contextReq.ctx?.decodedToken?.id;

        if (!adminId) throw new AppError(401, "Unauthorized");

        // 🛡️ High Security Check: ONLY Admins can delete users
        await requireGlobalRole(adminId, ["admin"]);

        // 🛡️ Safeguard 1: Prevent self-deletion through management API
        if (adminId === params.id) {
            throw new AppError(400, "For forensics and safety, admins cannot delete their own account through management tools. This must be performed by a peer.");
        }

        // 🛡️ Safeguard 2: Prevent the "Last Admin" deadlock
        await ensureNotLastAdmin(params.id);

        // Pre-fetch all files uploaded by the user to safely unlink them after CASCADE deletion
        const userFiles = await db.select().from(files).where(eq(files.uploaderId, params.id));

        const [deleted] = await db.transaction(async (tx) => {
            await tx.delete(invites).where(
                or(eq(invites.inviterId, params.id), eq(invites.targetUserId, params.id))
            );
            return tx.delete(users).where(eq(users.id, params.id)).returning();
        });

        if (!deleted) throw new AppError(404, "User not found");

        // Physically obliterate the user's files safely
        for (const file of userFiles) {
            const filePath = path.join("/app/uploads", file.savedName);
            try { await fs.unlink(filePath); } catch (e: any) {}
        }

        return {
            status: 200,
            body: { message: `User ${deleted.username} has been permanently deleted.` },
        };
    },
    getUserSessions: async ({ params, req }: { params: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const adminId = contextReq.ctx?.decodedToken?.id;

        if (!adminId) throw new AppError(401, "Unauthorized");

        // 🛡️ High Security Check: Admin/Moderator can audit sessions
        await requireGlobalRole(adminId, ["admin", "moderator"]);

        const response = await getActiveSessions(params.id);
        
        return {
            status: 200,
            body: response.data as any,
        };
    },
    revokeUserSession: async ({ params, req }: { params: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const adminId = contextReq.ctx?.decodedToken?.id;

        if (!adminId) throw new AppError(401, "Unauthorized");

        // 🛡️ High Security Check: ONLY Admins can force logout others
        await requireGlobalRole(adminId, ["admin"]);

        await logout(params.sessionId);

        return {
            status: 200,
            body: { message: "Session revoked successfully" },
        };
    },
    revokeAllUserSessions: async ({ params, req }: { params: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const adminId = contextReq.ctx?.decodedToken?.id;

        if (!adminId) throw new AppError(401, "Unauthorized");

        // 🛡️ High Security Check: ONLY Admins can perform a nuclear logout
        await requireGlobalRole(adminId, ["admin"]);

        await logoutAll(params.id);

        return {
            status: 200,
            body: { message: "All sessions for this user have been revoked" },
        };
    },
    getOrganizations: async ({ query, req }: { query: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;

        if (!userId) throw new AppError(401, "Unauthorized");

        await requireGlobalRole(userId, ["admin"]);

        const { page, pageSize, search } = query;
        const offset = (page - 1) * pageSize;

        const filters: any[] = [isNull(organizations.deletedAt)];
        if (search) {
            filters.push(
                or(
                    ilike(organizations.name, `%${search}%`),
                    ilike(organizations.slug, `%${search}%`),
                ),
            );
        }
        const whereClause = and(...filters);

        const orgList = await db
            .select()
            .from(organizations)
            .where(whereClause)
            .limit(pageSize)
            .offset(offset)
            .orderBy(desc(organizations.createdAt));

        const [totalCount] = await db
            .select({ value: sql`count(*)`.mapWith(Number) })
            .from(organizations)
            .where(whereClause);

        const total = totalCount?.value || 0;

        return {
            status: 200,
            body: {
                organizations: orgList as any,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    },
    deleteOrganization: async ({ params, req }: { params: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const adminId = contextReq.ctx?.decodedToken?.id;

        if (!adminId) throw new AppError(401, "Unauthorized");

        await requireGlobalRole(adminId, ["admin"]);

        // Pre-fetch organization details and its tournaments' banners before they are cascade deleted
        const oldOrg = await db.query.organizations.findFirst({
            where: eq(organizations.id, params.id),
        });

        const orgTournaments = await db
            .select({ bannerUrl: tournaments.bannerUrl })
            .from(tournaments)
            .where(eq(tournaments.organizationId, params.id));

        const [deleted] = await db
            .delete(organizations)
            .where(eq(organizations.id, params.id))
            .returning();

        if (!deleted) throw new AppError(404, "Organization not found");

        // Safely cleanup physical files
        if (oldOrg?.logoUrl) {
            FileService.deleteSystemFileByUrl(oldOrg.logoUrl).catch(() => {});
        }
        for (const t of orgTournaments) {
            if (t.bannerUrl) {
                FileService.deleteSystemFileByUrl(t.bannerUrl).catch(() => {});
            }
        }

        return {
            status: 200,
            body: {
                message: `Organization "${deleted.name}" and its tournaments (and related data) have been permanently deleted.`,
            },
        };
    },
});
