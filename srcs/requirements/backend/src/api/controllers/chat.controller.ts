import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import AppError from "@/utils/error";

const s = initServer();

const CHAT_API_URL = process.env.INTERNAL_CHAT_API_URL || "http://ft_chat:4000/api";

async function chatRequest<T>(path: string): Promise<{ status: number; body: T }> {
    let response: Response;

    try {
        response = await fetch(`${CHAT_API_URL}${path}`, {
            headers: {
                Accept: "application/json",
            },
        });
    } catch (error) {
        console.error("[chat.controller] Chat service request failed:", error);
        throw new AppError(502, "Chat service unavailable");
    }

    const rawBody = await response.text();
    let body: T | null = null;

    if (rawBody) {
        try {
            body = JSON.parse(rawBody) as T;
        } catch (error) {
            console.error("[chat.controller] Failed to parse chat service response:", error);
            throw new AppError(502, "Invalid response from chat service");
        }
    }

    return {
        status: response.status,
        body: body as T,
    };
}

export const chatController = s.router(contract.chat, {
    getStats: async () => {
        const response = await chatRequest("/chat/stats");

        if (response.status !== 200) {
            throw new AppError(502, "Failed to fetch chat statistics");
        }

        return {
            status: 200,
            body: response.body as any,
        };
    },
    getRoomInfo: async ({ params }) => {
        const response = await chatRequest(`/chat/rooms/${params.roomId}`);

        if (response.status === 404) {
            return {
                status: 404,
                body: response.body as any,
            };
        }

        if (response.status !== 200) {
            throw new AppError(502, "Failed to fetch chat room information");
        }

        return {
            status: 200,
            body: response.body as any,
        };
    },
    getRooms: async () => {
        const response = await chatRequest("/chat/rooms");

        if (response.status !== 200) {
            throw new AppError(502, "Failed to fetch chat rooms");
        }

        return {
            status: 200,
            body: response.body as any,
        };
    },
    getRoomMessages: async ({ params, query }) => {
        const searchParams = new URLSearchParams();

        if (query.limit) {
            searchParams.set("limit", query.limit);
        }

        if (query.offset) {
            searchParams.set("offset", query.offset);
        }

        const suffix = searchParams.size > 0 ? `?${searchParams.toString()}` : "";
        const response = await chatRequest(`/chat/rooms/${params.roomId}/messages${suffix}`);

        if (response.status === 404) {
            return {
                status: 404,
                body: response.body as any,
            };
        }

        if (response.status !== 200) {
            throw new AppError(502, "Failed to fetch chat messages");
        }

        return {
            status: 200,
            body: response.body as any,
        };
    },
});
