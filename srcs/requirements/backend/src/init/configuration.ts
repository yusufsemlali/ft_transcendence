import type { RequestHandler, Response, NextFunction } from "express";
import AppError from "../utils/error";
import { ExpressRequestWithContext } from "../api/types";

// Type for a simple feature flag map
export type SimpleConfiguration = Record<string, boolean>;

// Metadata type for required configuration
export type RequireConfiguration = {
  key: keyof SimpleConfiguration;
  invalidMessage?: string;
};

/**
 * Middleware to verify required configuration flags
 */
export function verifyRequiredConfiguration(
  requiredConfigs?: RequireConfiguration[]
): RequestHandler {
  return async (
    expressReq: any,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const req = expressReq as ExpressRequestWithContext;
    const config = req.ctx.configuration as SimpleConfiguration;

    if (!requiredConfigs || requiredConfigs.length === 0) {
      next();
      return;
    }

    try {
      for (const requirement of requiredConfigs) {
        const value = config[requirement.key];
        if (!value) {
          throw new AppError(
            503,
            requirement.invalidMessage ?? "This endpoint is currently unavailable.",
          );
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export async function getCachedConfiguration(skipCache?: boolean): Promise<any> {
  return {};
}