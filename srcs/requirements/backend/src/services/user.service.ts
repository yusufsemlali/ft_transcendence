import { db } from "@/dal/db";
import { users } from "@/dal/db/schemas/users";
import { eq, sql } from "drizzle-orm";
import AppError from "@/utils/error";
import { User } from "@ft-transcendence/contracts";

export const getUserById = async (id: number) => {
    const user = await db.query.users.findFirst({
        where: eq(users.id, id),
    });

    if (!user) {
        throw new AppError(404, "User not found");
    }

    return user;
};

export const getUserByUsername = async (username: string) => {
    const user = await db.query.users.findFirst({
        where: eq(users.username, username),
    });

    return user;
};

export const getUserByEmail = async (email: string) => {
    const user = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    return user;
};

export const updateUser = async (
    id: number,
    data: Partial<typeof users.$inferSelect>
) => {
    // Prevent updating immutable fields or security sensitive ones blindly if passed
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

    return updatedUser;
};

export const updateProfile = async (
    id: number,
    profileData: {
        displayName?: string;
        bio?: string;
        avatar?: string;
        tagline?: string;
    }
) => {
    return updateUser(id, profileData);
};

export const isUsernameAvailable = async (username: string, excludeUserId?: number): Promise<boolean> => {
    const existingUser = await getUserByUsername(username);
    if (!existingUser) return true;
    return existingUser.id === excludeUserId;
};

export const updateUsername = async (id: number, newUsername: string) => {
    const available = await isUsernameAvailable(newUsername, id);
    if (!available) {
        throw new AppError(409, "Username already taken");
    }

    return updateUser(id, { username: newUsername });
};

// Example of specific game logic adaptation
export const incrementXp = async (id: number, amount: number) => {
    if (amount <= 0) return;

    await db
        .update(users)
        .set({
            xp: sql`${users.xp} + ${amount}`,
            // Simple level up logic: level = 1 + floor(sqrt(xp) / 10) or similar
            // For now just incrementing XP
        })
        .where(eq(users.id, id));
};

export const deleteUser = async (id: number) => {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    if (result.length === 0) {
        throw new AppError(404, "User not found");
    }
};
