"use server";

import { cookies } from "next/headers";
import { api } from "./api";

export interface UserInfo {
    username: string;
    level: number;
    avatar: string;
}

/**
 * Fetches the currently authenticated user from the backend using the 'token' cookie.
 * This function runs on the server.
 */
export async function getServerUser(): Promise<UserInfo | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return null;
        }

        const response = await api.users.getMe({
            extraHeaders: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 200) {
            return {
                username: response.body.username,
                level: response.body.level,
                avatar: response.body.avatar
            };
        }
    } catch (error) {
    }
    return null;
}

/**
 * Server Action to logout: clears the token cookie.
 */
export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete("token");
}
