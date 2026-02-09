import { z } from "zod";
import { UserSchema } from "./users";

export const RegisterInputSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
    password: z.string().min(8).max(100),
});

export const LoginInputSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const AuthResponseSchema = z.object({
    token: z.string(),
    user: UserSchema,
});

export const RefreshResponseSchema = z.object({
    token: z.string(),
});

export const SessionSchema = z.object({
    id: z.string().uuid(),
    userAgent: z.string().nullable(),
    ipAddress: z.string().nullable(),
    createdAt: z.coerce.date(),
    expiresAt: z.coerce.date().nullable(),
});

export const SessionsResponseSchema = z.object({
    sessions: z.array(SessionSchema),
});

export const LogoutResponseSchema = z.object({
    success: z.boolean(),
});

export const LogoutAllResponseSchema = z.object({
    success: z.boolean(),
    sessionsRevoked: z.number(),
});

export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type RefreshResponse = z.infer<typeof RefreshResponseSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type SessionsResponse = z.infer<typeof SessionsResponseSchema>;
