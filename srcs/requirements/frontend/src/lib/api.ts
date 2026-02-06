import { initClient } from "@ts-rest/core";
import { contract } from "@ft-transcendence/contracts";

// Determine the base URL based on environment (Server vs Client)
const isServer = typeof window === "undefined";
const baseUrl = isServer
    ? (process.env.INTERNAL_API_URL || "http://ft_backend:3000")
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080");

export const api = initClient(contract, {
    baseUrl,
    baseHeaders: {
        "Content-Type": "application/json",
    },
});
