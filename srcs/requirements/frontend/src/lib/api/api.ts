import { contract } from "@ft-transcendence/contracts";
import { buildClient } from "./adapters/ts-rest-adapter";

// Determine the base URL based on environment (Server vs Client)
const isServer = typeof window === "undefined";
const baseUrl = isServer
    ? (process.env.INTERNAL_BACKEND_API_URL || "http://ft_backend:3000/api")
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api");

const timeout =  Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 10_000;

const tsRestClient = buildClient(contract, baseUrl, timeout);

// API Endpoints
const api = {
  ...tsRestClient,
};

export default api;

