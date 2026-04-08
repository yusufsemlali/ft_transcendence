"use server";

import { cookies } from "next/headers";
import type { UserInfo } from "@/lib/types/user";

export type { UserInfo };

const BACKEND_URL = process.env.INTERNAL_BACKEND_API_URL || "http://ft_backend:3000/api";

export async function getServerUser(): Promise<UserInfo | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("access_token")?.value;

        if (!token) {
            return null;
        }

        const response = await fetch(`${BACKEND_URL}/users/me`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`, 
            },
            cache: "no-store",
        });

        // We DO NOT attempt to refresh the token here anymore. 
        // If it's a 401, we just return null. The client-side adapter 
        // will catch this on hydration and do the refresh securely.
        if (response.ok) {
            const data = await response.json();
            return {
                id: data.id,
                username: data.username,
                email: data.email,
                displayName: data.displayName || "",
                bio: data.bio || "",
                tagline: data.tagline || "",
                avatar: data.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                banner: data.banner || "",
                level: data.level,
                role: data.role,
            };
        }
    } catch (error) {
        if (error instanceof Error && !error.message.includes('fetch failed')) {
            console.log("Failed to get server user:", error);
        }
    }
    return null;
}

export async function logoutAction(): Promise<{ success: boolean }> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("access_token")?.value;

        if (token) {
            await fetch(`${BACKEND_URL}/auth/logout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({}),
                cache: "no-store",
            });
        }
    } catch (error) {
        console.log("Backend logout failed:", error);
    }

    const cookieStoreParams = await cookies();
    cookieStoreParams.delete("access_token");
    cookieStoreParams.delete("refresh_token");
    cookieStoreParams.delete("token"); 

    return { success: true };
}

export async function logoutAllAction(): Promise<{ success: boolean; sessionsRevoked?: number }> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("access_token")?.value;

        if (token) {
            const response = await fetch(`${BACKEND_URL}/auth/logout-all`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({}),
                cache: "no-store",
            });

            if (response.ok) {
                const data = await response.json();
                const cookieStoreParams = await cookies();
                cookieStoreParams.delete("access_token");
                cookieStoreParams.delete("refresh_token");
                cookieStoreParams.delete("token");
                return { success: true, sessionsRevoked: data.sessionsRevoked };
            }
        }
    } catch (error) {
        console.log("Backend logout all failed:", error);
    }

    return { success: false };
}

export async function getActiveSessions() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("access_token")?.value;

        if (!token) {
            return [];
        }

        const response = await fetch(`${BACKEND_URL}/auth/sessions`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            cache: "no-store",
        });

        if (response.ok) {
            const data = await response.json();
            return data.sessions;
        }
    } catch (error) {
        console.log("Failed to get sessions:", error);
    }
    return [];
}
