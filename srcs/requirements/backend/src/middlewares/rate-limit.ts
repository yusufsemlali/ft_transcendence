import { Request, Response, NextFunction } from "express";
import { rateLimit } from "express-rate-limit";
import { RateLimiterMemory } from "rate-limiter-flexible";
import AppError from "../utils/error";
import { ExpressRequestWithContext } from "../api/types";

export const REQUEST_MULTIPLIER =  100  ; // set to 100 because wer  are in dev, if later going prod , please change to 1;

// Basic custom handler for rate-limit exceeded
export const customHandler = (
  req: any,
  _res: Response,
  _next: NextFunction
): void => {
  throw new AppError(429, "Request limit reached, please try again later.");
};

// Root rate limiter
export const rootRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10 * REQUEST_MULTIPLIER,
  handler: customHandler,
});

// Upload rate limiter
export const uploadRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 uploads per minute
  handler: customHandler,
});

// Bad authentication limiter
const badAuthRateLimiter = new RateLimiterMemory({
  points: 30 * REQUEST_MULTIPLIER,
  duration: 60 * 60, // 1 hour
});

export async function badAuthRateLimiterHandler(
  req: ExpressRequestWithContext,
  res: Response,
  next: NextFunction
) {
  try {
    const key = req.ctx.requestId; // or use IP if you prefer
    const rate = await badAuthRateLimiter.get(key);
    if (rate && rate.remainingPoints <= 0) {
      throw new AppError(429, "Too many failed authentication attempts.");
    }
  } catch (err) {
    next(err);
    return;
  }
  next();
}

export async function incrementBadAuth(
  req: ExpressRequestWithContext,
  status: number
) {
  // Only increment for flagged status codes
  const flagged = [401, 403]; // example
  if (!flagged.includes(status)) return;

  try {
    const key = req.ctx.requestId;
    await badAuthRateLimiter.penalty(key, 1);
  } catch {}
}
