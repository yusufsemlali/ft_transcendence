import fs from "fs/promises";
import path from "path";
import { db } from "@/dal/db";
import { users } from "@/dal/db/schemas/users";
import { files } from "@/dal/db/schemas/files";
import { userSettings } from "@/dal/db/schemas/settings";
import { friendships } from "@/dal/db/schemas/social";
import { organizationMembers } from "@/dal/db/schemas/organizations";
import { notifications } from "@/dal/db/schemas/notifications";
import { invites } from "@/dal/db/schemas/lobby";
import { eq, or } from "drizzle-orm";
import AppError from "@/utils/error";

export class GdprService {

    /** Export all personal data for a user (GDPR Right to Access) */
    static async exportUserData(userId: string) {
        const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
        if (!user) throw new AppError(404, "User not found");

        const { password, twoFactorSecret, ...safeUser } = user;

        const settings = await db.query.userSettings.findFirst({
            where: eq(userSettings.userId, userId),
        });

        const friends = await db.select().from(friendships).where(
            or(eq(friendships.senderId, userId), eq(friendships.receiverId, userId))
        );

        const orgMemberships = await db.select().from(organizationMembers).where(
            eq(organizationMembers.userId, userId)
        );

        const userFiles = await db.select({
            id: files.id,
            originalName: files.originalName,
            mimeType: files.mimeType,
            sizeBytes: files.sizeBytes,
            url: files.url,
            createdAt: files.createdAt,
        }).from(files).where(eq(files.uploaderId, userId));

        const userNotifications = await db.select().from(notifications).where(
            eq(notifications.userId, userId)
        );

        return {
            user: safeUser,
            settings: settings || null,
            friends,
            organizations: orgMemberships,
            files: userFiles,
            chatMessages: [],
            notifications: userNotifications,
            exportedAt: new Date().toISOString(),
        };
    }

    /** Convert export data to CSV */
    static dataToCsv(data: Record<string, any>): string {
        const lines: string[] = [];
        const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;

        lines.push("=== USER PROFILE ===");
        lines.push(Object.keys(data.user).join(","));
        lines.push(Object.values(data.user).map(esc).join(","));
        lines.push("");

        for (const section of ["friends", "files", "notifications", "organizations"] as const) {
            const arr = data[section];
            if (arr?.length > 0) {
                lines.push(`=== ${section.toUpperCase()} ===`);
                lines.push(Object.keys(arr[0]).join(","));
                for (const row of arr) {
                    lines.push(Object.values(row).map(esc).join(","));
                }
                lines.push("");
            }
        }

        lines.push(`Exported at: ${data.exportedAt}`);
        return lines.join("\n");
    }

    /** Delete account and all data (GDPR Right to Erasure) */
    static async deleteAccount(userId: string) {
        const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
        if (!user) throw new AppError(404, "User not found");

        if (user.role === "admin") {
            throw new AppError(400, "Admins cannot self-delete via GDPR. Contact another admin.");
        }

        const userFiles = await db.select().from(files).where(eq(files.uploaderId, userId));

        await db.transaction(async (tx) => {
            await tx.delete(invites).where(
                or(eq(invites.inviterId, userId), eq(invites.targetUserId, userId))
            ).catch(() => {});
            await tx.delete(users).where(eq(users.id, userId));
        });

        for (const file of userFiles) {
            const filePath = path.join("/app/uploads", file.savedName);
            try { await fs.unlink(filePath); } catch {}
        }

        return { message: `Account "${user.username}" and all associated data have been permanently deleted.` };
    }
}
