import { db } from "@/dal/db";
import { users } from "@/dal/db/schemas/users";
import { sessions } from "@/dal/db/schemas/sessions";
import { refreshTokens } from "@/dal/db/schemas/refresh_tokens";
import {
    hashPassword,
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    hashRefreshToken,
    sanitizeUser,
} from "@/utils/auth";
import { eq, or, and } from "drizzle-orm";
import AppError from "@/utils/error";

// registration
export const register = async (
    email: string,
    username: string,
    password: string,
    ipAddress: string,
    userAgent?: string,
) => {
    const existingUser = await db
        .select()
        .from(users)
        .where(or(eq(users.email, email), eq(users.username, username)));

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
    const [user] = await db
        .insert(users)
        .values({ email, username, password: hashedPassword })
        .returning();

    const { accessToken, refreshToken } = await createSession(
        user.id,
        user.username,
        user.role,
        ipAddress,
        userAgent,
    );

    return { user: sanitizeUser(user), accessToken, refreshToken };
};

// login
export const login = async (
    email: string,
    password: string,
    ipAddress: string,
    userAgent?: string,
) => {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
        throw new AppError(401, "Invalid credentials");
    }

    const isPasswordValid = await comparePassword(password, user.password || "");
    if (!isPasswordValid) {
        throw new AppError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await createSession(
        user.id,
        user.username,
        user.role,
        ipAddress,
        userAgent,
    );

    return { user: sanitizeUser(user), accessToken, refreshToken };
};

// refresh access token
export const refreshAccessToken = async (refreshToken: string) => {
    const tokenHash = hashRefreshToken(refreshToken);

    const [storedToken] = await db
        .select()
        .from(refreshTokens)
        .where(and(eq(refreshTokens.token, tokenHash), eq(refreshTokens.revoked, false)));

    if (!storedToken) {
        throw new AppError(401, "Invalid or expired refresh token");
    }

    const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, storedToken.sessionId));

    if (!session || (session.expiresAt && session.expiresAt < new Date())) {
        throw new AppError(401, "Session expired");
    }

    const [user] = await db.select().from(users).where(eq(users.id, session.userId));
    if (!user) {
        throw new AppError(401, "User not found");
    }

    const newRefreshToken = generateRefreshToken();
    const newTokenHash = hashRefreshToken(newRefreshToken);

    await db
        .update(refreshTokens)
        .set({ revoked: true, updatedAt: new Date() })
        .where(eq(refreshTokens.id, storedToken.id));

    await db.insert(refreshTokens).values({
        sessionId: session.id,
        token: newTokenHash,
        parent: tokenHash,
    });

    const accessToken = generateAccessToken(user.id, session.id, user.username, user.role);

    return { accessToken, refreshToken: newRefreshToken };
};

// logout (current session)
export const logout = async (sessionId: string) => {
    await db
        .update(refreshTokens)
        .set({ revoked: true, updatedAt: new Date() })
        .where(eq(refreshTokens.sessionId, sessionId));

    await db.delete(sessions).where(eq(sessions.id, sessionId));

    return { success: true };
};

// logout all (all sessions of user)
export const logoutAll = async (userId: string) => {
    const userSessions = await db
        .select({ id: sessions.id })
        .from(sessions)
        .where(eq(sessions.userId, userId));

    for (const session of userSessions) {
        await db
            .update(refreshTokens)
            .set({ revoked: true, updatedAt: new Date() })
            .where(eq(refreshTokens.sessionId, session.id));
    }

    await db.delete(sessions).where(eq(sessions.userId, userId));

    return { success: true, sessionsRevoked: userSessions.length };
};

// get active session
export const getActiveSessions = async (userId: string) => {
    const userSessions = await db
        .select({
            id: sessions.id,
            userAgent: sessions.userAgent,
            ipAddress: sessions.ipAddress,
            createdAt: sessions.createdAt,
            expiresAt: sessions.expiresAt,
        })
        .from(sessions)
        .where(eq(sessions.userId, userId));

    return userSessions;
};

// heler: create session and token
const createSession = async (
    userId: string,
    username: string,
    role: string,
    ipAddress: string,
    userAgent?: string,
) => {
    const [session] = await db
        .insert(sessions)
        .values({
            userId,
            ipAddress,
            userAgent,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        })
        .returning();

    const accessToken = generateAccessToken(userId, session.id, username, role);
    const refreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(refreshToken);

    await db.insert(refreshTokens).values({
        sessionId: session.id,
        token: tokenHash,
    });

    return { session, accessToken, refreshToken };
};
