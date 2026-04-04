import { db } from "@/dal/db";
import { organizationMembers } from "@/dal/db/schemas/organizations";
import { users } from "@/dal/db/schemas/users";
import { and, eq, sql } from "drizzle-orm";
import AppError from "@/utils/error";
import { OrgRole } from "@ft-transcendence/contracts";


/**
 * Ensures a user has the required role(s) within an organization.
 * Throws a 403 Forbidden AppError if unauthorized.
 */
export async function requireOrgRole(userId: string, organizationId: string, allowedRoles: OrgRole[]) {
    const [membership] = await db
        .select({ role: organizationMembers.role })
        .from(organizationMembers)
        .where(
            and(
                eq(organizationMembers.userId, userId),
                eq(organizationMembers.organizationId, organizationId)
            )
        );

    // 1. Are they even in the organization?
    if (!membership) {
        throw new AppError(403, "You do not have access to this organization.");
    }

    // 2. Do they have the right rank?
    if (!allowedRoles.includes(membership.role as OrgRole)) {
        throw new AppError(
            403, 
            `Insufficient permissions. Requires one of: ${allowedRoles.join(", ")}.`
        );
    }

    return membership.role; // Return it in case the controller needs to know
}

/**
 * Ensures a user has a required Global role (e.g. Admin/Moderator).
 * Checks against the DB for maximum security (ignores stale tokens).
 */
export async function requireGlobalRole(userId: string, allowedRoles: string[]) {
    const [user] = await db
        .select({ role: users.role, status: users.status })
        .from(users)
        .where(eq(users.id, userId));

    if (!user) {
        throw new AppError(404, "User not found.");
    }

    if (user.status === 'banned' || user.status === 'suspended') {
        throw new AppError(403, `Account restricted. Status: ${user.status}`);
    }

    if (!allowedRoles.includes(user.role)) {
        throw new AppError(
            403, 
            `Insufficient platform permissions. Requires: ${allowedRoles.join(", ")}.`
        );
    }

    return user;
}

/**
 * 🛡️ Safeguard: Ensures that the user is not the VERY LAST active Admin in the system.
 * This prevents deadlocks where no one is left to manage the platform.
 */
export async function ensureNotLastAdmin(targetId: string) {
    // 1. Fetch target user details
    const [targetUser] = await db
        .select({ id: users.id, role: users.role, status: users.status })
        .from(users)
        .where(eq(users.id, targetId));
    
    // 2. Only proceed if the target is currently an active Admin
    if (targetUser?.role === "admin" && targetUser?.status === "active") {
        // 3. Count total active Admins
        const [adminCount] = await db
            .select({ value: sql`count(*)`.mapWith(Number) })
            .from(users)
            .where(and(eq(users.role, "admin"), eq(users.status, "active")));
        
        // 4. Block if they are the last one
        if (adminCount.value <= 1) {
            throw new AppError(
                400, 
                "Critical Action Blocked: This user is the last active Super Admin. " +
                "You must promote another user to Admin before removing or suspending this account."
            );
        }
    }
}
