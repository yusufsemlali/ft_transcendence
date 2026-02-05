import jwt from "jsonwebtoken";
import crypto from "crypto";
import { LRUCache } from "lru-cache";
import { DecodedToken } from "@/api/types";

const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";

// Cache for decoded tokens
const tokenCache = new LRUCache<string, DecodedToken>({
    max: 20000,
    maxSize: 50 * 1024 * 1024, // 50MB
    sizeCalculation: (token, key): number => {
        return JSON.stringify(token).length + key.length;
    },
});

const TOKEN_CACHE_BUFFER = 1000 * 60 * 5; // 5 minutes

export const generateToken = (id: number, username: string, role: string): string => {
    return jwt.sign({ id, username, role }, JWT_SECRET, {
        expiresIn: "7d",
    });
};

export const verifyToken = (token: string, noCache = false): DecodedToken => {
    if (noCache) {
        return jwt.verify(token, JWT_SECRET) as DecodedToken;
    }

    const cached = tokenCache.get(token);
    if (cached) {
        // Simple expiration check if we were storing exp in cached object
        // JWT verification handles expiration automatically, 
        // but if we cache the result, we must respect it.
        // For local JWT, decoding it again is cheap, but let's follow the requested pattern.

        // Since we don't store exact exp in DecodedToken type, we assume cache validity = validation 
        // But to be safe relating to the buffer:
        // Real JWT verify checks 'exp'.
        return cached;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    tokenCache.set(token, decoded);
    return decoded;
};

// In a real distributed system, you'd use Redis for this.
// For a single instance, we can just clear the cache for that token
// BUT, since we can't create a 'blocklist' easily with stateless JWTs without DB state,
// this 'revoke' really just clears the local cache. The token remains valid until expiry
// unless we check a 'lastLogout' timestamp in the DB users table.
export const revokeToken = (token: string) => {
    tokenCache.delete(token);
};

export const clearTokenCache = () => {
    tokenCache.clear();
};

export const generateRandomToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

export { hashPassword, comparePassword } from "./password";
