import { db } from "@/dal/db";
import { users } from "@/dal/db/schemas/users";
import { eq, sql, ilike, or } from "drizzle-orm";
import AppError from "@/utils/error";
import { sanitizeUser } from "@/utils/auth";
import { ApiResponse } from "@/utils/response";

export const searchUsers = async (query: string, limit: number = 10) => {
    const pattern = `%${query}%`;
    const results = await db
        .select({
            id: users.id,
            username: users.username,
            email: users.email,
            role: users.role,
            status: users.status,
            displayName: users.displayName,
            avatar: users.avatar,
            xp: users.xp,
            level: users.level,
            eloRating: users.eloRating,
            isOnline: users.isOnline,
            createdAt: users.createdAt,
        })
        .from(users)
        .where(
            or(
                ilike(users.username, pattern),
                ilike(users.displayName, pattern)
            )
        )
        .limit(limit);

    return new ApiResponse("Users found", results);
};

export const getUserById = async (id: string) => {
    const user = await db.query.users.findFirst({
        where: eq(users.id, id),
    });

    if (!user) {
        throw new AppError(404, "User not found");
    }

    return new ApiResponse("User fetched successfully", sanitizeUser(user));
};

export const getUserByUsername = async (username: string) => {
    const user = await db.query.users.findFirst({
        where: eq(users.username, username),
    });

    return new ApiResponse("User fetched successfully", sanitizeUser(user));
};

export const getUserByEmail = async (email: string) => {
    const user = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    return new ApiResponse("User fetched successfully", sanitizeUser(user));
};

export const updateUser = async (
    id: string,
    data: Partial<typeof users.$inferSelect>
) => {
    try {
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
            throw new AppError(404, "User found but update returned no data");
        }

        return new ApiResponse("User updated successfully", sanitizeUser(updatedUser));
    } catch (error: any) {
        // Gracefully handle PostgreSQL Unique Violations
        if (error.code === '23505') {
            if (error.constraint === 'users_username_unique') {
                throw new AppError(409, "This username is already taken.");
            }
            if (error.constraint === 'users_email_unique') {
                throw new AppError(409, "This email is already registered.");
            }
        }
        throw error;
    }
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
    const response = await getUserByUsername(username);
    const existingUser = response.data;
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

import { hashPassword, comparePassword } from "@/utils/auth";

export const changePassword = async (id: string, current: string, newPass: string) => {
    const user = await db.query.users.findFirst({
        where: eq(users.id, id),
    });

    if (!user) {
        throw new AppError(404, "User not found");
    }

    if (!user.password) {
        throw new AppError(400, "User registered via OAuth and does not have a password. Set one via Reset Password.");
    }

    const isValid = await comparePassword(current, user.password);
    if (!isValid) {
        throw new AppError(401, "Current password is incorrect");
    }

    const hashed = await hashPassword(newPass);
    await db
        .update(users)
        .set({
            password: hashed,
            updatedAt: new Date(),
        })
        .where(eq(users.id, id));

    return new ApiResponse("Password changed successfully", null);
};
