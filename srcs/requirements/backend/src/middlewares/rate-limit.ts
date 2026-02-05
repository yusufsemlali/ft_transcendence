import rateLimit from "express-rate-limit";

/**
 * Root rate limiter.
 * Prevents DDoS and brute force attacks on the main API.
 */
export const rootRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 429,
        message: "Too many requests, please try again later.",
    },
});

/**
 * Stricter limiter for authentication attempts.
 */
export const authRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 failed login attempts per hour
    message: {
        status: 429,
        message: "Too many login attempts, please try again in an hour.",
    },
});
