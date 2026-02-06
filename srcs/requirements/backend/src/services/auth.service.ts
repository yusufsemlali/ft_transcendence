import { db } from "@/dal/db";
import { users } from "@/dal/db/schemas/users";
import { hashPassword, comparePassword, generateToken } from "@/utils/auth";
import { eq, or } from "drizzle-orm";
import AppError from "@/utils/error";

// task A (Register) : 
export const register = async (email: string, username: string, password: string) => {
    try {
        const existingUser = await db.select().from(users).where(
            or(
                eq(users.email, email),
                eq(users.username, username)
            )
        );


        if (existingUser.length > 0) {
            const user = existingUser[0];
            if (user.email === email) {
                throw new AppError(409, "Email already in use");
            }
            if (user.username === username) {
                throw new AppError(409, "Username already taken");
            }
            throw new AppError(409, "User already exists");
        }

        const hashedPassword = await hashPassword(password);
        const [user] = await db.insert(users).values({ email, username, password: hashedPassword }).returning();

        const token = generateToken(user.id, user.username, user.role);

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    } catch (error) {
        throw error;
    }
}

// task B (Login) : 
export const login = async (email: string, password: string) => {
    try {
        const existingUser = await db.select().from(users).where(eq(users.email, email));
        if (existingUser.length === 0) {
            throw new AppError(404, "User not found");
        }

        const isPasswordValid = await comparePassword(password, existingUser[0].password);
        if (!isPasswordValid) {
            throw new AppError(401, "Invalid password");
        }

        const user = existingUser[0];
        const token = generateToken(user.id, user.username, user.role);

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;

        return { user: userWithoutPassword, token };

    } catch (error) {
        throw error;
    }
}