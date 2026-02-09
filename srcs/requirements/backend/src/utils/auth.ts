import jwt from "jsonwebtoken";
import crypto from "crypto";
import { DecodedToken } from "@/api/types";
import { users } from "@/dal/db/schemas/users";

const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_BYTES = 32;

export const generateAccessToken = (id: string, sessionId: string, username: string, role: string): string => {
    return jwt.sign({ id, sessionId, username, role }, JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
    });
};

export const verifyAccessToken = (token: string): DecodedToken => {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
};

export const generateRefreshToken = (): string => {
    return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
};

export const hashRefreshToken = (token: string): string => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

export const sanitizeUser = (user: typeof users.$inferSelect | undefined) => {
    if (!user) return null;
    const { password: _, twoFactorSecret: __, ...sanitizedUser } = user;
    return sanitizedUser;
};

export { hashPassword, comparePassword } from "./password";
