import { NextFunction, Response } from "express";
import { TsRestRequestHandler } from "@ts-rest/express";
import { AppRoute, AppRouter } from "@ts-rest/core";
import { verifyAccessToken } from "../utils/auth";
import AppError from "../utils/error";
import { DecodedToken } from "../api/types";

export function authenticateTsRestRequest<
    T extends AppRouter | AppRoute,
>(): TsRestRequestHandler<T> {
    return async (
        req: any,
        _res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const authHeader = req.headers.authorization;

        try {
            if (authHeader && authHeader.startsWith("Bearer ")) {
                const token = authHeader.split(" ")[1];

                try {
                    const decoded = verifyAccessToken(token);

                    req.ctx = {
                        ...req.ctx,
                        decodedToken: {
                            ...decoded,
                            type: "Bearer"
                        }
                    };
                } catch (err) {
                    // Explicitly handle token error vs generic error
                    throw new AppError(401, "Token expired or invalid - please login again");
                }
            } else {
                req.ctx = {
                    ...req.ctx,
                    decodedToken: { type: "None", id: "", sessionId: "", username: "guest", role: "guest" }
                };
            }
            next();
        } catch (error) {
            next(error);
        }
    };
}

