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
        res: Response,
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
                    res.status(401).json({ message: "Token expired or invalid - please login again" });
                    return;
                }
            } else {
                req.ctx = {
                    ...req.ctx,
                    decodedToken: { type: "None", id: "", sessionId: "", username: "guest", role: "guest" }
                } as any;
            }
            next();
        } catch (error) {
            next(error);
        }
    };
}

