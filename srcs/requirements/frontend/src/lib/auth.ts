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
    } catch {
      console.log("user was not obtained");
    }
    return null;
}

/**
 * Server Action to login: sets the token cookie.
 */
export async function loginAction(token: string) {
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
        httpOnly: true, // Secure: JS cannot access this cookie
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
    });
}

/**
 * Server Action to logout: clears the token cookie.
 */
export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete("token");
}
