
export async function getIdToken(): Promise<string | null> {
    return null; // Browser handles cookies automatically
}

let refreshPromise: Promise<boolean> | null = null;

export async function refreshToken(_baseUrl?: string): Promise<boolean> {
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        try {
            const refreshUrl = typeof window !== "undefined"
                ? "/bff/auth/refresh"
                : `${_baseUrl || "http://ft_backend:3000/api"}/auth/refresh`;

            const response = await fetch(refreshUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
                credentials: "include",
            });

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

    try {
        return await refreshPromise;
    } finally {
        refreshPromise = null;
    }
}
