import { z } from "zod";

export const NotificationTypeSchema = z.enum([
    "friend_request",
    "tournament_invite",
    "match_starting",
    "achievement_unlocked",
    "system_alert",
]);

export const NotificationSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    type: NotificationTypeSchema,
    title: z.string(),
    body: z.string().nullable(),
    refId: z.string().uuid().nullable(),
    readAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
});

export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationType = z.infer<typeof NotificationTypeSchema>;
