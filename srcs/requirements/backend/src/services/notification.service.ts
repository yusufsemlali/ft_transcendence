import { db } from "@/dal/db";
import { notifications } from "@/dal/db/schemas/notifications";

type NotificationType = 
    | "friend_request" 
    | "tournament_invite" 
    | "organization_invite"
    | "match_starting" 
    | "achievement_unlocked" 
    | "system_alert";

export async function createNotification(params: {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    refId?: string;
}): Promise<void> {
    await db.insert(notifications).values({
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body ?? null,
        refId: params.refId ?? null,
    });
}
