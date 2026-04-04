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
    bio: z.string().max(500).nullable(),
    tagline: z.string().max(100).nullable(),
    avatar: z.string().trim().max(2048).nullable(),
    banner: z.string().trim().max(2048).nullable(),
    xp: z.number().nonnegative(),
    level: z.number().positive(),
    eloRating: z.number(),
    preferredLanguage: z.string().max(5),
    theme: z.string().max(10).nullable(),
    isOnline: z.boolean(),
    createdAt: z.coerce.date(),
});

export const CreateUserSchema = z.object({
    username: z.string().min(3).max(24),
    email: z.string().email(),
    password: z.string().min(8),
});

export const UpdateUserSchema = UserSchema.pick({
    username: true,
    displayName: true,
    bio: true,
    tagline: true,
    avatar: true,
    banner: true,
    preferredLanguage: true,
    theme: true,
}).partial().strict();

export const PublicUserSchema = UserSchema.pick({
    id: true,
    username: true,
    displayName: true,
    avatar: true,
    xp: true,
    level: true,
    isOnline: true,
});

export type User = z.infer<typeof UserSchema>;
export type PublicUser = z.infer<typeof PublicUserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
