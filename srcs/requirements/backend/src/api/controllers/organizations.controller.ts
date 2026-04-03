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
                    isNull(organizations.deletedAt)
                )
            );

        return {
            status: 200,
            body: new ApiResponse("Organizations retrieved successfully", memberOrgs as any) as any,
        };
    },
    getOrganization: async ({ params }: { params: any }) => {
        const [org] = await db
            .select()
            .from(organizations)
            .where(and(eq(organizations.id, params.id), isNull(organizations.deletedAt)));

        if (!org) {
             throw new AppError(404, "Organization not found");
        }

        // 📊 Calculate Stats
        const [membersCount] = await db
            .select({ value: count() })
            .from(organizationMembers)
            .where(eq(organizationMembers.organizationId, params.id));

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

        // RBAC Check: Only owner or admin can update
        await requireOrgRole(userId, params.id, ["owner", "admin"]);

        try {
            const [updated] = await db
                .update(organizations)
                .set({
                    ...body,
                    updatedAt: new Date(),
                })
                .where(and(eq(organizations.id, params.id), isNull(organizations.deletedAt)))
                .returning();

            if (!updated) {
                throw new AppError(404, "Organization not found");
            }

            return {
                status: 200,
                body: new ApiResponse("Organization updated successfully", updated as any) as any
            };
        } catch (error: any) {
            const errorCode = error.code || error.cause?.code;
            const constraintName = error.constraint || error.cause?.constraint || "";

            const isSlugViolation = errorCode === '23505' && 
                (constraintName.includes('slug_unique') || constraintName.includes('slug_key') || error.message.includes('slug'));

            if (isSlugViolation) {
                throw new AppError(409, "An organization with this slug already exists.");
            }
            throw error;
        }
    },
    deleteOrganization: async ({ params, req }: { params: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;

        if (!userId) throw new AppError(401, "Unauthorized");

        // RBAC: ONLY the owner can delete the entire organization
        await requireOrgRole(userId, params.id, ["owner"]);

        const [deleted] = await db
            .delete(organizations)
            .where(eq(organizations.id, params.id))
            .returning();

        if (!deleted) {
            throw new AppError(404, "Organization not found");
        }

        return {
            status: 200,
            body: new ApiResponse("Organization and all its data permanently deleted successfully", null) as any
        };
    },
    createOrganization: async ({ body, req }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;

        if (!userId || contextReq.ctx?.decodedToken?.type === "None") {
            throw new AppError(401, "Must be logged in to create an organization");
        }

        try {
            const newOrg = await db.transaction(async (tx) => {
                const [org] = await tx.insert(organizations).values({
                    name: body.name,
                    slug: body.slug, // Normalization (trim/lowercase) is now handled by Zod transform
                    description: body.description,
                    logoUrl: body.logoUrl,
                    visibility: body.visibility || 'public',
                }).returning();

                await tx.insert(organizationMembers).values({
                    organizationId: org.id,
                    userId: userId,
                    role: 'owner'
                });

                return org;
            });

            return {
                status: 201 as const,
                body: new ApiResponse("Organization created successfully", newOrg as any) as any
            };
        } catch (error: any) {
            const errorCode = error.code || error.cause?.code;
            const constraintName = error.constraint || error.cause?.constraint || "";

            const isSlugViolation = errorCode === '23505' && 
                (constraintName.includes('slug_unique') || constraintName.includes('slug_key') || error.message.includes('slug'));

            if (isSlugViolation) {
                throw new AppError(409, "An organization with this slug already exists.");
            }
            throw error;
        }
    },
    addMember: async ({ params, body, req }: { params: any; body: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;

        if (!userId) throw new AppError(401, "Unauthorized");

        // RBAC: Only owner or admin can add members
        await requireOrgRole(userId, params.id, ["owner", "admin"]);

        // Resolve user by email
        const [targetUser] = await db.select().from(users).where(eq(users.email, body.email));
        if (!targetUser) throw new AppError(404, "Target user not found");

        // Check for existing membership
        const [existing] = await db.select().from(organizationMembers).where(
            and(
                eq(organizationMembers.organizationId, params.id),
                eq(organizationMembers.userId, targetUser.id)
            )
        );
        if (existing) throw new AppError(409, "User is already a member of this organization");

        try {
            await db.insert(organizationMembers).values({
                organizationId: params.id,
                userId: targetUser.id,
                role: body.role as any
            });

            return {
                status: 201,
                body: new ApiResponse("Member added successfully", null) as any
            };
        } catch (error: any) {
            const errorCode = error.code || error.cause?.code;
            const constraintName = error.constraint || error.cause?.constraint || "";

            if (errorCode === '23505' && constraintName.includes('unique_owner_per_org')) {
                throw new AppError(400, "This organization already has an owner. You can only have one owner per organization.");
            }
            throw error;
        }
    },
    updateMemberRole: async ({ params, body, req }: { params: any; body: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;

        if (!userId) throw new AppError(401, "Unauthorized");

        // RBAC: Only owner can change roles
        await requireOrgRole(userId, params.id, ["owner"]);

        // Safety: Prevent owner from demoting themselves (must always have an owner)
        if (userId === params.userId && body.role !== 'owner') {
             throw new AppError(403, "Owners cannot demote themselves to avoid leaving the organization ownerless.");
        }

        const [existing] = await db.select().from(organizationMembers).where(
            and(
                eq(organizationMembers.organizationId, params.id),
                eq(organizationMembers.userId, params.userId)
            )
        );
        if (!existing) throw new AppError(404, "Member not found");

        try {
            await db.update(organizationMembers)
                .set({ role: body.role as any })
                .where(
                    and(
                        eq(organizationMembers.organizationId, params.id),
                        eq(organizationMembers.userId, params.userId)
                    )
                );

            return {
                status: 200,
                body: new ApiResponse("Member role updated successfully", null) as any
            };
        } catch (error: any) {
            const errorCode = error.code || error.cause?.code;
            const constraintName = error.constraint || error.cause?.constraint || "";

            if (errorCode === '23505' && constraintName.includes('unique_owner_per_org')) {
                throw new AppError(400, "Cannot promote this user to owner. This organization already has one.");
            }
            throw error;
        }
    },
    leaveOrganization: async ({ params, req }: { params: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;

        if (!userId) throw new AppError(401, "Unauthorized");

        const [membership] = await db
            .select()
            .from(organizationMembers)
            .where(
                and(
                    eq(organizationMembers.organizationId, params.id),
                    eq(organizationMembers.userId, userId)
                )
            );

        if (!membership) throw new AppError(404, "You are not a member of this organization");

        // 🛡️ OWNER SAFETY: Cannot leave the ship you own
        if (membership.role === "owner") {
            throw new AppError(403, "The organization owner cannot leave. You must either transfer ownership first or delete the organization.");
        }

        await db
            .delete(organizationMembers)
            .where(
                and(
                    eq(organizationMembers.organizationId, params.id),
                    eq(organizationMembers.userId, userId)
                )
            );

        return {
            status: 200,
            body: new ApiResponse("You have left the organization successfully", null) as any
        };
    },
    removeMember: async ({ params, req }: { params: any; req: any }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;

        if (!userId) throw new AppError(401, "Unauthorized");

        // RBAC Check: Admin or Owner can kick
        await requireOrgRole(userId, params.id, ["owner", "admin"]);

        // Target Check: Is the person being kicked the owner?
        const [targetMember] = await db
            .select()
            .from(organizationMembers)
            .where(
                and(
                    eq(organizationMembers.organizationId, params.id),
                    eq(organizationMembers.userId, params.userId)
                )
            );

        if (!targetMember) throw new AppError(404, "Member not found in this organization");
        
        // 🛡️ NO MUTINY RULE: Cannot kick the owner
        if (targetMember.role === "owner") {
            throw new AppError(403, "The organization owner cannot be removed.");
        }

        // 🛡️ HIERARCHY RULE: Admins shouldn't kick other admins
        const [requester] = await db
            .select()
            .from(organizationMembers)
            .where(
                and(
                    eq(organizationMembers.organizationId, params.id),
                    eq(organizationMembers.userId, userId)
                )
            );

        if (requester.role === "admin" && targetMember.role === "admin" && userId !== params.userId) {
            throw new AppError(403, "Admins cannot kick other admins.");
        }

        await db
            .delete(organizationMembers)
            .where(
                and(
                    eq(organizationMembers.organizationId, params.id),
                    eq(organizationMembers.userId, params.userId)
                )
            );

        return {
            status: 200,
            body: new ApiResponse("Member kicked successfully", null) as any
        };
    },
    getOrganizationMembers: async ({ params }: { params: any }) => {
        // 🛡️ The Ghost Guard: Make sure the org exists first
        const [org] = await db
            .select({ id: organizations.id })
            .from(organizations)
            .where(and(eq(organizations.id, params.id), isNull(organizations.deletedAt)));

        if (!org) {
             throw new AppError(404, "Organization not found");
        }

        const membersList = await db
            .select({
                id: users.id,
                username: users.username,
                email: users.email,
                role: organizationMembers.role,
                joinedAt: organizationMembers.joinedAt,
            })
            .from(organizationMembers)
            .innerJoin(users, eq(organizationMembers.userId, users.id))
            .where(eq(organizationMembers.organizationId, params.id));

        return {
            status: 200,
            body: new ApiResponse("Members retrieved successfully", membersList as any) as any,
        };
    }
});
