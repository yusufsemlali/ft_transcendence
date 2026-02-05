import { NextFunction, Request, Response } from "express";
import { COMPATIBILITY_CHECK, COMPATIBILITY_CHECK_HEADER } from "@ft-transcendence/contracts";

/**
 * Middleware that ensures the frontend is compatible with the backend.
 * It sends the current backend compatibility version in the header of every response.
 */
export const compatibilityCheckMiddleware = (
    _req: Request,
    res: Response,
    next: NextFunction
): void => {
    res.setHeader(COMPATIBILITY_CHECK_HEADER, COMPATIBILITY_CHECK.toString());
    next();
};
