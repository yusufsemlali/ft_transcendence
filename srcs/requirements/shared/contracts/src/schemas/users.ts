import { z } from "zod";

export const UserRoleSchema = z.enum(['user', 'admin', 'moderator', 'organizer']);
export const UserStatusSchema = z.enum(['active', 'suspended', 'banned', 'muted']);

export const UserSchema = z.object({
    id: z.string().uuid(),
    username: z.string().min(3).max(24),
    email: z.string().email(),
    role: UserRoleSchema,
    status: UserStatusSchema,
    displayName: z.string().max(50).nullable(),
    avatar: z.string(),
    xp: z.number().nonnegative(),
    level: z.number().positive(),
    eloRating: z.number(),
    isOnline: z.boolean(),
    createdAt: z.coerce.date(),
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
