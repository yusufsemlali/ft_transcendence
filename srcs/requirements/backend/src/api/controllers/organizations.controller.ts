import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import { RequestWithContext } from "@/api/types";
import AppError from "@/utils/error";
import { db } from "@/dal/db";
import { organizations, organizationMembers } from "@/dal/db/schemas/organizations";
import { tournaments } from "@/dal/db/schemas/tournaments";
import { users } from "@/dal/db/schemas/users";
import { and, eq, isNull, count, notInArray } from "drizzle-orm";
import { requireOrgRole } from "@/utils/rbac";
import { ApiResponse } from "@/utils/response";
import * as NotificationService from "@/services/notification.service";

const s = initServer();

export const organizationsController = s.router(contract.organizations, {
    getOrganizations: async ({ req }: { req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;

        if (!userId || contextReq.ctx?.decodedToken?.type === "None") {
            throw new AppError(401, "Not authenticated");
        }

        const memberOrgs = await db
            .select({
                id: organizations.id,
                name: organizations.name,
                slug: organizations.slug,
                description: organizations.description,
                logoUrl: organizations.logoUrl,
                visibility: organizations.visibility,
                createdAt: organizations.createdAt,
                updatedAt: organizations.updatedAt,
                deletedAt: organizations.deletedAt,
            })
            .from(organizations)
            .innerJoin(
                organizationMembers, 
                eq(organizations.id, organizationMembers.organizationId)
            )
            .where(
                and(
                    eq(organizationMembers.userId, userId),
                    eq(organizationMembers.status, "active"),
                    isNull(organizations.deletedAt)
                )
            );

        return {
            status: 200,
            body: new ApiResponse("Organizations retrieved successfully", memberOrgs as any) as any,
        };
    },
    getOrganization: async ({ params, req }: { params: any, req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;

        const [org] = await db
            .select()
            .from(organizations)
            .where(and(eq(organizations.id, params.id), isNull(organizations.deletedAt)));

        if (!org) {
             throw new AppError(404, "Organization not found");
        }

        if (org.visibility === 'private') {
            if (!userId) {
                throw new AppError(401, "Must be logged in to view private organizations");
            }
            await requireOrgRole(userId, org.id, ["owner", "admin", "referee", "member"]);
        }

        const [membersCount] = await db
            .select({ value: count() })
            .from(organizationMembers)
            .where(and(eq(organizationMembers.organizationId, params.id), eq(organizationMembers.status, "active")));

        const [totalTourneys] = await db
            .select({ value: count() })
            .from(tournaments)
            .where(eq(tournaments.organizationId, params.id));

        const [activeTourneys] = await db
            .select({ value: count() })
            .from(tournaments)
            .where(
                and(
                    eq(tournaments.organizationId, params.id),
                    notInArray(tournaments.status, ["completed", "cancelled"])
                )
            );

        return {
            status: 200,
            body: new ApiResponse("Organization profile retrieved", {
                ...org,
                stats: {
                    memberCount: Number(membersCount?.value || 0),
                    totalTournaments: Number(totalTourneys?.value || 0),
                    activeTournaments: Number(activeTourneys?.value || 0),
                }
            } as any) as any,
        };
    },
    updateOrganization: async ({ params, body, req }: { params: any; body: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");
        await requireOrgRole(userId, params.id, ["owner", "admin"]);

        try {
            const [updated] = await db
                .update(organizations)
                .set({ ...body, updatedAt: new Date() })
                .where(and(eq(organizations.id, params.id), isNull(organizations.deletedAt)))
                .returning();

            if (!updated) throw new AppError(404, "Organization not found");

            return {
                status: 200,
                body: new ApiResponse("Organization updated successfully", updated as any) as any
            };
        } catch (error: any) {
            if (error.code === '23505') throw new AppError(409, "Slug already taken.");
            throw error;
        }
    },
    deleteOrganization: async ({ params, req }: { params: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");
        await requireOrgRole(userId, params.id, ["owner"]);

        const [deleted] = await db.delete(organizations).where(eq(organizations.id, params.id)).returning();
        if (!deleted) throw new AppError(404, "Organization not found");

        return { status: 200, body: new ApiResponse("Organization permanently deleted", null) as any };
    },
    createOrganization: async ({ body, req }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Not authenticated");

        try {
            const newOrg = await db.transaction(async (tx: any) => {
                const [org] = await tx.insert(organizations).values({
                    name: body.name,
                    slug: body.slug,
                    description: body.description,
                    logoUrl: body.logoUrl,
                    visibility: body.visibility || 'public',
                }).returning();

                await tx.insert(organizationMembers).values({
                    organizationId: org.id,
                    userId: userId,
                    role: 'owner',
                    status: 'active'
                });
                return org;
            });

            return { status: 201, body: new ApiResponse("Organization created successfully", newOrg as any) as any };
        } catch (error: any) {
            if (error.code === '23505') throw new AppError(409, "Slug already taken.");  
            throw error;
        }
    },
    addMember: async ({ params, body, req }: { params: any; body: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");
        await requireOrgRole(userId, params.id, ["owner", "admin"]);

        const [targetUser] = await db.select().from(users).where(eq(users.email, body.email));
        if (!targetUser) {
            return {
                status: 201,
                body: new ApiResponse("If an account matches that email, an invitation has been sent.", null) as any
            };
        }

        const [existing] = await db.select().from(organizationMembers).where(
            and(eq(organizationMembers.organizationId, params.id), eq(organizationMembers.userId, targetUser.id))
        );
        if (existing) {
            if (existing.status === 'pending') throw new AppError(409, "Invitation already pending.");
            throw new AppError(409, "User is already a member.");
        }

        const [org] = await db.select().from(organizations).where(eq(organizations.id, params.id));

        await db.insert(organizationMembers).values({
            organizationId: params.id,
            userId: targetUser.id,
            role: body.role as any,
            status: 'pending'
        });

        await NotificationService.createNotification({
            userId: targetUser.id,
            type: "organization_invite",
            title: `Invitation to join ${org.name}`,
            body: `You have been invited to join ${org.name} as a ${body.role}.`,
            refId: org.id
        });

        return {
            status: 201,
            body: new ApiResponse("Invitation sent successfully.", null) as any
        };
    },
    getMyInvites: async ({ req }: { req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        const invites = await db
            .select({
                organizationId: organizations.id,
                organizationName: organizations.name,
                organizationSlug: organizations.slug,
                role: organizationMembers.role,
                joinedAt: organizationMembers.joinedAt,
            })
            .from(organizationMembers)
            .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
            .where(and(eq(organizationMembers.userId, userId), eq(organizationMembers.status, "pending")));

        return {
            status: 200,
            body: new ApiResponse("Invites retrieved", invites as any) as any
        };
    },
    acceptInvite: async ({ params, req }: { params: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        const [updated] = await db
            .update(organizationMembers)
            .set({ status: 'active', joinedAt: new Date() })
            .where(and(
                eq(organizationMembers.organizationId, params.id),
                eq(organizationMembers.userId, userId),
                eq(organizationMembers.status, 'pending')
            ))
            .returning();

        if (!updated) throw new AppError(404, "Invitation not found.");
        return { status: 200, body: new ApiResponse("Invitation accepted", null) as any };
    },
    declineInvite: async ({ params, req }: { params: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        const [deleted] = await db
            .delete(organizationMembers)
            .where(and(
                eq(organizationMembers.organizationId, params.id),
                eq(organizationMembers.userId, userId),
                eq(organizationMembers.status, 'pending')
            ))
            .returning();

        if (!deleted) throw new AppError(404, "Invitation not found.");
        return { status: 200, body: new ApiResponse("Invitation declined", null) as any };
    },
    updateMemberRole: async ({ params, body, req }: { params: any; body: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");
        await requireOrgRole(userId, params.id, ["owner"]);

        if (userId === params.userId && body.role !== 'owner') {
             throw new AppError(403, "Owners cannot demote themselves.");
        }

        const [updated] = await db.update(organizationMembers)
            .set({ role: body.role as any })
            .where(and(eq(organizationMembers.organizationId, params.id), eq(organizationMembers.userId, params.userId)))
            .returning();
            
        if (!updated) throw new AppError(404, "Member not found");
        return { status: 200, body: new ApiResponse("Member role updated", null) as any };
    },
    leaveOrganization: async ({ params, req }: { params: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        const [membership] = await db.select().from(organizationMembers).where(
            and(eq(organizationMembers.organizationId, params.id), eq(organizationMembers.userId, userId))
        );
        if (!membership) throw new AppError(404, "Not a member");
        if (membership.role === "owner") throw new AppError(403, "Owner cannot leave");

        await db.delete(organizationMembers).where(and(eq(organizationMembers.organizationId, params.id), eq(organizationMembers.userId, userId)));
        return { status: 200, body: new ApiResponse("Left successfully", null) as any };
    },
    removeMember: async ({ params, req }: { params: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");
        await requireOrgRole(userId, params.id, ["owner", "admin"]);

        const [targetMember] = await db.select().from(organizationMembers).where(
            and(eq(organizationMembers.organizationId, params.id), eq(organizationMembers.userId, params.userId))
        );
        if (!targetMember) throw new AppError(404, "Member not found");
        if (targetMember.role === "owner") throw new AppError(403, "Owner cannot be removed");

        const [requester] = await db.select().from(organizationMembers).where(
            and(eq(organizationMembers.organizationId, params.id), eq(organizationMembers.userId, userId))
        );
        if (requester.role === "admin" && targetMember.role === "admin" && userId !== params.userId) {
            throw new AppError(403, "Admins cannot kick other admins.");
        }

        await db.delete(organizationMembers).where(and(eq(organizationMembers.organizationId, params.id), eq(organizationMembers.userId, params.userId)));
        return { status: 200, body: new ApiResponse("Member removed", null) as any };
    },
    getOrganizationMembers: async ({ params, req }: { params: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");
        await requireOrgRole(userId, params.id, ["owner", "admin", "referee", "member"]);

        const membersList = await db
            .select({
                id: users.id,
                username: users.username,
                displayName: users.displayName,
                avatar: users.avatar,
                xp: users.xp,
                level: users.level,
                isOnline: users.isOnline,
                orgRole: organizationMembers.role,
                status: organizationMembers.status,
                joinedAt: organizationMembers.joinedAt,
            })
            .from(organizationMembers)
            .innerJoin(users, eq(organizationMembers.userId, users.id))
            .where(eq(organizationMembers.organizationId, params.id));

        return {
            status: 200,
            body: new ApiResponse("Members retrieved manually", membersList as any) as any,
        };
    }
});
