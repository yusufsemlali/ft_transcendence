import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { MessageSchema, RoomSchema } from "../schemas/chat";

const c = initContract();

export const chatContract = c.router({
    getStats: {
        method: "GET",
        path: "/chat/stats",
        responses: {
            200: z.object({
                connectedUsers: z.number(),
                activeRooms: z.number(),
                totalMessages: z.number(),
            }),
        },
        summary: "Get chat server statistics",
    },
    getRoomInfo: {
        method: "GET",
        path: "/chat/rooms/:roomId",
        responses: {
            200: z.object({
                room: z.string(),
                userCount: z.number(),
                messageCount: z.number(),
                createdAt: z.coerce.date(),
            }),
            404: z.object({ message: z.string() }),
        },
        summary: "Get information about a chat room",
    },
    getRooms: {
        method: "GET",
        path: "/chat/rooms",
        responses: {
            200: z.array(RoomSchema),
        },
        summary: "Get all active chat rooms",
    },
    getRoomMessages: {
        method: "GET",
        path: "/chat/rooms/:roomId/messages",
        query: z.object({
            limit: z.string().optional(),
            offset: z.string().optional(),
        }),
        responses: {
            200: z.array(MessageSchema),
            404: z.object({ message: z.string() }),
        },
        summary: "Get messages from a specific room",
    },
});
