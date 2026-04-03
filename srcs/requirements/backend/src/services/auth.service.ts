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
    generateAccessToken as generateToken,
    verifyAccessToken as verifyToken,
} from "@/utils/auth";
import { eq, or, and } from "drizzle-orm";
import AppError from "@/utils/error";
import { ApiResponse } from "@/utils/response";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";

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

    return new ApiResponse("Registration successful", { user: sanitizeUser(user), accessToken, refreshToken });
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

    await checkAccountHealth(user);

    const { accessToken, refreshToken } = await createSession(
        user.id,
        user.username,
        user.role,
        ipAddress,
        userAgent,
    );

    return new ApiResponse("Login successful", { user: sanitizeUser(user), accessToken, refreshToken });
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

    return new ApiResponse("Token refreshed successfully", { accessToken, refreshToken: newRefreshToken });
};

// logout (current session)
export const logout = async (sessionId: string) => {
    await db
        .update(refreshTokens)
        .set({ revoked: true, updatedAt: new Date() })
        .where(eq(refreshTokens.sessionId, sessionId));

    await db.delete(sessions).where(eq(sessions.id, sessionId));

    return new ApiResponse("Logout successful", { success: true });
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

    return new ApiResponse("All sessions logged out", { success: true, sessionsRevoked: userSessions.length });
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

    return new ApiResponse("Active sessions retrieved", userSessions);
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

const checkAccountHealth = async (user: typeof users.$inferSelect) => {
    if (user.status === "banned") {
        const reason = user.banReason ? ` Reason: ${user.banReason}` : "";
        throw new AppError(403, `This account has been permanently banned from the platform.${reason}`);
    }

    if (user.status === "suspended") {
        const reason = user.banReason ? ` Reason: ${user.banReason}` : "";

        // Check if suspension has expired
        if (user.bannedUntil && user.bannedUntil <= new Date()) {
            // 🔄 Auto-Reactivate the user
            await db.update(users)
                .set({
                    status: 'active',
                    banReason: null,
                    bannedUntil: null,
                    updatedAt: new Date()
                })
                .where(eq(users.id, user.id));

            console.log(`[Auth] User ${user.username} suspension expired. Auto-reactivated.`);
            return; // Allow login to proceed
        }

        if (user.bannedUntil && user.bannedUntil > new Date()) {
            const dateStr = user.bannedUntil.toLocaleString();
            throw new AppError(403, `Your account is currently suspended until ${dateStr}.${reason}`);
        }

        // Permanent suspension (no end date)
        throw new AppError(403, `Your account is currently suspended. Please contact support.${reason}`);
    }
}

// --- FortyTwo OAuth Logic ---

export const getFortyTwoAuthUrl = () => {
    const FORTYTWO_CLIENT_ID = process.env.FORTYTWO_CLIENT_ID;
    const FORTYTWO_CALLBACK_URL = process.env.FORTYTWO_CALLBACK_URL;

    if (!FORTYTWO_CLIENT_ID || !FORTYTWO_CALLBACK_URL) {
        throw new AppError(500, "FortyTwo OAuth is not configured");
    }

    const url = new URL("https://api.intra.42.fr/oauth/authorize");
    url.searchParams.append("client_id", FORTYTWO_CLIENT_ID);
    url.searchParams.append("redirect_uri", FORTYTWO_CALLBACK_URL);
    url.searchParams.append("response_type", "code");
    url.searchParams.append("scope", "public");

    return { url: url.toString() };
};

export const handleFortyTwoCallback = async (code: string, ip: string, userAgent?: string): Promise<{
    type: "login";
    data: { user: any; accessToken: string; refreshToken: string };
} | {
    type: "pending_consent";
    pendingToken: string;
    profile: { username: string; email: string; avatar: string };
}> => {
    const FORTYTWO_CLIENT_ID = process.env.FORTYTWO_CLIENT_ID;
    const FORTYTWO_CLIENT_SECRET = process.env.FORTYTWO_CLIENT_SECRET;
    const FORTYTWO_CALLBACK_URL = process.env.FORTYTWO_CALLBACK_URL;

    if (!FORTYTWO_CLIENT_ID || !FORTYTWO_CLIENT_SECRET || !FORTYTWO_CALLBACK_URL) {
        throw new AppError(500, "FortyTwo OAuth is not configured");
    }

    // 1. Exchange code for access token
    const tokenResponse = await fetch("https://api.intra.42.fr/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: FORTYTWO_CLIENT_ID,
            client_secret: FORTYTWO_CLIENT_SECRET,
            code,
            redirect_uri: FORTYTWO_CALLBACK_URL,
        }),
    });

    if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        throw new AppError(401, error.error_description || "Failed to exchange 42 code");
    }

    const { access_token } = await tokenResponse.json();

    // 2. Fetch user profile from 42
    const profileResponse = await fetch("https://api.intra.42.fr/v2/me", {
        headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!profileResponse.ok) {
        throw new AppError(401, "Failed to fetch 42 profile");
    }

    const profile = await profileResponse.json();
    console.log(`[Auth] 42 Profile received for ${profile.login} (ID: ${profile.id})`);

    // 2. Check if user already exists by 42 ID
    const existingUserById = await db.query.users.findFirst({
        where: eq(users.fortytwoId, profile.id),
    });

    if (existingUserById) {
        console.log(`[Auth] Existing user found by 42 ID: ${existingUserById.username}`);

        await checkAccountHealth(existingUserById);

        const { accessToken, refreshToken } = await createSession(
            existingUserById.id,
            existingUserById.username,
            existingUserById.role,
            ip,
            userAgent,
        );
        return {
            type: "login",
            data: { user: sanitizeUser(existingUserById), accessToken, refreshToken },
        };
    }

    // 3. Try finding by email (for users who registered with same email but haven't linked 42)
    const existingUserByEmail = await db.query.users.findFirst({
        where: eq(users.email, profile.email),
    });

    if (existingUserByEmail) {
        console.log(`[Auth] Existing user found by email: ${existingUserByEmail.username}. Redirecting to consent for linking.`);
        // Note: For email matching, we still REQUIRE consent because we want to let them know
        // that their local account is now being merged with their 42 account ID.
    }

    // 4. User is new. We MUST NOT store data yet.
    // Return a temporary token (Valid for 15 mins) that contains 42 data.
    const pendingToken = jwt.sign(
        {
            fortytwoId: profile.id,
            email: profile.email,
            username: profile.login,
            avatar: profile.image?.link || profile.image?.versions?.medium,
        },
        JWT_SECRET,
        { expiresIn: "15m" }
    );

    return {
        type: "pending_consent",
        pendingToken,
        profile: {
            username: profile.login,
            email: profile.email,
            avatar: profile.image?.link,
        },
    };
};

export const confirmFortyTwoRegistration = async (
    pendingToken: string,
    consent: boolean,
    ip: string,
    userAgent?: string
) => {
    if (!consent) {
        throw new AppError(400, "Consent is required to register");
    }

    let decoded: any;
    try {
        decoded = jwt.verify(pendingToken, JWT_SECRET);
    } catch (err) {
        throw new AppError(401, "Invalid or expired registration token");
    }

    // Check if another user registered with this ID in the meantime
    const [existing] = await db
        .select()
        .from(users)
        .where(or(eq(users.fortytwoId, decoded.fortytwoId), eq(users.username, decoded.username)));

    if (existing) {
        throw new AppError(409, "User already registered");
    }

    // Now we have permission. Create the user.
    const [user] = await db
        .insert(users)
        .values({
            username: decoded.username,
            email: decoded.email,
            fortytwoId: decoded.fortytwoId,
            avatar: decoded.avatar,
            emailConfirmedAt: new Date(),
        })
        .returning();

    const { accessToken, refreshToken } = await createSession(
        user.id,
        user.username,
        user.role,
        ip,
        userAgent,
    );

    return new ApiResponse("Registration successful", {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
    });
};
