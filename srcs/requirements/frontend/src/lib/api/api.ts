import { contract } from "@ft-transcendence/contracts";
import { buildClient } from "./adapters/ts-rest-adapter";

// Determine the base URL based on environment (Server vs Client)
const isServer = typeof window === "undefined";
const baseUrl = isServer
    ? (process.env.INTERNAL_BACKEND_API_URL || "http://ft_backend:3000/api")
    : "/bff"; // Client-side: route through Next.js BFF proxy to avoid browser console errors

const timeout =  Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 10_000;

const tsRestClient = buildClient(contract, baseUrl, timeout);

// API Endpoints
const api = {
  ...tsRestClient,
};

export default api;

