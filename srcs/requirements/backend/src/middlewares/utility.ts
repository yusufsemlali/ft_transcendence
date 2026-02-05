import { NextFunction, Request, Response } from "express";

/**
 * Utility middleware.
 * Can be used for small request manipulations, logging, or sanitization.
 */
export const utilityMiddleware = (
    _req: Request,
    _res: Response,
    next: NextFunction
): void => {
    // Placeholder for utility logic
    next();
};

/**
 * Ensures that if a route expects a certain body structure, it's there.
 */
export const v4RequestBody = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    // Monkeytype uses this to handle specific legacy body formats
    next();
};
