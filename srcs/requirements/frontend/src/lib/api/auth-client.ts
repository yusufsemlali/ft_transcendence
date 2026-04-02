
export async function getIdToken(): Promise<string | null> {
    return null; // Browser handles cookies automatically
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export async function refreshToken(baseUrl: string): Promise<boolean> {
    if (isRefreshing && refreshPromise) {
        return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            const response = await fetch(`${baseUrl}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
                credentials: "include",
            });

            if (response.ok) {
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
