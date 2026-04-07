import { z } from "zod";

export const FriendshipStatusSchema = z.enum(['pending', 'accepted', 'blocked']);

export const FriendSchema = z.object({
    id: z.string().uuid(),
    username: z.string(),
    displayName: z.string().nullable(),
    avatar: z.string(),
    isOnline: z.boolean(),
    status: FriendshipStatusSchema,
    friendshipId: z.string().uuid(),
    since: z.coerce.date(),
});

export type Friend = z.infer<typeof FriendSchema>;
export type FriendshipStatus = z.infer<typeof FriendshipStatusSchema>;
