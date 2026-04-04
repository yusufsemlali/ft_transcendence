import { NextFunction, Response } from "express";
import { TsRestRequestHandler } from "@ts-rest/express";
import { AppRoute, AppRouter } from "@ts-rest/core";
import { verifyAccessToken } from "../utils/auth";
import AppError from "../utils/error";

export function authenticateTsRestRequest<
    T extends AppRouter | AppRoute,
>(): TsRestRequestHandler<T> {
    return async (
        req: any,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        // 1. Look for the token in the Bearer header first
        let token = req.headers.authorization?.split(" ")[1];

        // 2. If not in the header, look for it in the cookies
        if (!token && req.cookies && req.cookies.access_token) {
            token = req.cookies.access_token;
        }

        try {
            if (token) {
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
                    // Silently fail authentication and treat as Guest
                    // This allows public endpoints (login/register) to work even with expired tokens
                    req.ctx = {
                        ...req.ctx,
                        decodedToken: { type: "None", id: "", sessionId: "", username: "guest", role: "guest" }
                    } as any;
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
