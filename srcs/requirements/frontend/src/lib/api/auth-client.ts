
export async function getIdToken(): Promise<string | null> {
    return null; // Browser handles cookies automatically
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export async function refreshToken(_baseUrl?: string): Promise<boolean> {
    if (isRefreshing && refreshPromise) {
        return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            // Always use the BFF proxy on the client to avoid browser console errors
            const refreshUrl = typeof window !== "undefined"
                ? "/bff/auth/refresh"
                : `${_baseUrl || "http://ft_backend:3000/api"}/auth/refresh`;

            const response = await fetch(refreshUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
                credentials: "include",
            });

            // BFF proxy always returns 200 — check the real status via header
            const realStatus = response.headers.get("X-BFF-Status");
            const isSuccess = realStatus ? parseInt(realStatus, 10) < 400 : response.ok;

            if (isSuccess) {
                return true;
            }
        } catch (error) {
            console.log("Token refresh failed:", error);
        }
        return false;
    })();

    const result = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;
    return result;
}
