import { initClient, tsRestFetchApi, ApiFetcherArgs } from "@ts-rest/core";
import { contract } from "@ft-transcendence/contracts";

// Determine the base URL based on environment (Server vs Client)
const isServer = typeof window === "undefined";
const baseUrl = isServer
    ? (process.env.INTERNAL_BACKEND_API_URL || "http://ft_backend:3000/api")
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api");

// Custom fetcher middleware to handle Auth and Timeouts
async function customFetcher(args: ApiFetcherArgs) {
    const { fetchOptions, headers } = args;
    
    // 1. Auto-inject Authorization token
    // We only access localStorage on the client
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
    }

    // 2. Add Timeout (default 10s)
    const timeout = Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 10000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        // Merge our signal with any existing signal
        const finalOptions = {
            ...fetchOptions,
            signal: controller.signal,
        };

        // Call the default ts-rest fetcher
        const result = await tsRestFetchApi({ 
            ...args,
            fetchOptions: finalOptions,
            headers: headers, // Pass the modified headers explicitly
        });
        
        // Global 401 Handling
        if (result.status === 401 && typeof window !== 'undefined') {
            console.warn("Session expired. Logging out.");
            localStorage.removeItem("token");
            // Optional: Redirect to login
            // window.location.href = "/login";
        }

        return result;
    } finally {
        clearTimeout(timeoutId);
    }
}

export const api = initClient(contract, {
    baseUrl,
    api: customFetcher,
    baseHeaders: {
        "Content-Type": "application/json",
    },
});
