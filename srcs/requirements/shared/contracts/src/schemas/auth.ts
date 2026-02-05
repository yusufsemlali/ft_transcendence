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

export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
