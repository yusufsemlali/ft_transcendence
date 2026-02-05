import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { TsRestRequestHandler } from "@ts-rest/express";
import { AppRoute, AppRouter } from "@ts-rest/core";
import AppError from "../utils/error";
import { RequestWithContext, DecodedToken } from "../api/types";

const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";

export function authenticateTsRestRequest<
    T extends AppRouter | AppRoute,
>(): TsRestRequestHandler<T> {
    return async (
        req: any, // Using any here to bypass the strict ts-rest request type for context injection
        _res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const authHeader = req.headers.authorization;

        try {
            if (authHeader && authHeader.startsWith("Bearer ")) {
                const token = authHeader.split(" ")[1];
                const decoded = await authenticateWithBearerToken(token);

                req.ctx = {
                    ...req.ctx,
                    decodedToken: decoded
                };
            } else {
                // Default to "None" but don't fail yet - controllers can check if req.ctx.decodedToken exists
                req.ctx = {
                    ...req.ctx,
                    decodedToken: { type: "None", id: 0, username: "guest", role: "guest" }
                };
            }
            next();
        } catch (error) {
            next(error);
        }
    };
}

async function authenticateWithBearerToken(token: string): Promise<DecodedToken> {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return {
            type: "Bearer",
            id: decoded.id,
            username: decoded.username,
            role: decoded.role
        };
    } catch (error) {
        throw new AppError(401, "Token expired or invalid - please login again");
    }
}
