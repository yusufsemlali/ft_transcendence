import { z } from "zod";

export const UserRoleSchema = z.enum(['user', 'admin', 'moderator', 'organizer']);

export const UserSchema = z.object({
    id: z.string().uuid(),
    username: z.string().min(3).max(24),
    email: z.string().email(),
    role: UserRoleSchema,
    displayName: z.string().max(50).nullable(),
    avatar: z.string().url(),
    xp: z.number().nonnegative(),
    level: z.number().positive(),
    eloRating: z.number(),
    isOnline: z.boolean(),
    createdAt: z.date(),
});

export const CreateUserSchema = z.object({
    username: z.string().min(3).max(24),
    email: z.string().email(),
    password: z.string().min(8),
});

export const UpdateUserSchema = UserSchema.partial().omit({
    id: true,
    createdAt: true,
});

export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
