import { db } from "@/dal/db";
import { users } from "@/dal/db/schemas/users";
import { eq, sql } from "drizzle-orm";
import AppError from "@/utils/error";
import { sanitizeUser } from "@/utils/auth";

export const getUserById = async (id: string) => {
    const user = await db.query.users.findFirst({
        where: eq(users.id, id),
    });

    if (!user) {
        throw new AppError(404, "User not found");
    }

    return sanitizeUser(user);
};

export const getUserByUsername = async (username: string) => {
    const user = await db.query.users.findFirst({
        where: eq(users.username, username),
    });

    return sanitizeUser(user);
};

export const getUserByEmail = async (email: string) => {
    const user = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    return sanitizeUser(user);
};

export const updateUser = async (
    id: string,
    data: Partial<typeof users.$inferSelect>
) => {
    const { id: _, password: __, ...updateData } = data;

    const [updatedUser] = await db
        .update(users)
        .set({
            ...updateData,
            updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

    if (!updatedUser) {
        throw new AppError(404, "User not found");
    }

    return sanitizeUser(updatedUser);
};

export const updateProfile = async (
    id: string,
    profileData: {
        displayName?: string;
        bio?: string;
        avatar?: string;
        tagline?: string;
    }
) => {
    return updateUser(id, profileData);
};

export const isUsernameAvailable = async (username: string, excludeUserId?: string): Promise<boolean> => {
    const existingUser = await getUserByUsername(username);
    if (!existingUser) return true;
    return existingUser.id === excludeUserId;
};

export const updateUsername = async (id: string, newUsername: string) => {
    const available = await isUsernameAvailable(newUsername, id);
    if (!available) {
        throw new AppError(409, "Username already taken");
    }

    return updateUser(id, { username: newUsername });
};

export const incrementXp = async (id: string, amount: number) => {
    if (amount <= 0) return;

    await db
        .update(users)
        .set({
            xp: sql`${users.xp} + ${amount}`,
        })
        .where(eq(users.id, id));
};

export const deleteUser = async (id: string) => {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    if (result.length === 0) {
        throw new AppError(404, "User not found");
    }
};
