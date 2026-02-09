"use server";

import { cookies } from "next/headers";

export interface UserInfo {
    id: string;
    username: string;
    email: string;
    level: number;
    avatar: string;
    role: string;
}

// Backend URL for server-side calls
const BACKEND_URL = process.env.INTERNAL_BACKEND_API_URL || "http://ft_backend:3000/api";

/**
 * Fetches the currently authenticated user from the backend using the 'token' cookie.
 * If the token is expired, attempts to refresh it automatically.
 */
export async function getServerUser(): Promise<UserInfo | null> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return null;
        }

        // Use native fetch for server-side calls
        let response = await fetch(`${BACKEND_URL}/users/me`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            cache: "no-store",
        });

        // If token expired, try to refresh
        if (response.status === 401) {
            const refreshResult = await refreshTokensServer();
            if (refreshResult.success && refreshResult.token) {
                // Retry with new token
                response = await fetch(`${BACKEND_URL}/users/me`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${refreshResult.token}`,
                    },
                    cache: "no-store",
                });
            }
        }

        if (response.ok) {
            const data = await response.json();
            return {
                id: data.id,
                username: data.username,
                email: data.email,
                level: data.level,
                avatar: data.avatar,
                role: data.role,
            };
        }
    } catch (error) {
        // Silently return null if not authenticated - this is expected behavior
        // Only log if it's a real network/server error
        if (error instanceof Error && !error.message.includes('fetch failed')) {
            console.error("Failed to get server user:", error);
        }
    }
    return null;
}

/**
 * Server-side token refresh using the refresh_token cookie.
 */
async function refreshTokensServer(): Promise<{ success: boolean; token?: string }> {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refresh_token")?.value;

        if (!refreshToken) {
            return { success: false };
        }

        const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": `refresh_token=${refreshToken}`,
            },
            body: JSON.stringify({}),
            cache: "no-store",
        });

        if (response.ok) {
            const data = await response.json();
            const newToken = data.token;

            // Update the access token cookie
            cookieStore.set("token", newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 15, // 15 minutes
            });

            return { success: true, token: newToken };
        }
    } catch (error) {
        console.error("Failed to refresh tokens:", error);
    }
    return { success: false };
}

/**
 * Server Action to set auth cookies after login/register.
 */
export async function setAuthCookies(accessToken: string) {
    const cookieStore = await cookies();

    // Set access token cookie
    cookieStore.set("token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 15, // 15 minutes
    });
}

/**
 * Server Action to logout: calls backend and clears cookies.
 */
export async function logoutAction(): Promise<{ success: boolean }> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (token) {
            // Call backend logout to invalidate session
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
        console.error("Backend logout failed:", error);
    }

    // Always clear cookies, even if backend call fails
    const cookieStore = await cookies();
    cookieStore.delete("token");
    cookieStore.delete("refresh_token");

    return { success: true };
}

/**
 * Server Action to logout from all devices.
 */
export async function logoutAllAction(): Promise<{ success: boolean; sessionsRevoked?: number }> {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

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
                cookieStore.delete("token");
                cookieStore.delete("refresh_token");
                return { success: true, sessionsRevoked: data.sessionsRevoked };
            }
        }
    } catch (error) {
        console.error("Backend logout all failed:", error);
    }

    return { success: false };
}

/**
 * Get active sessions for the current user.
 */
export async function getActiveSessions() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

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
        console.error("Failed to get sessions:", error);
    }
    return [];
}

// Legacy export for backwards compatibility
export const loginAction = setAuthCookies;
