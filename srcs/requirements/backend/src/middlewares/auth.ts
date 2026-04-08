import { NextFunction, Response } from "express";
import { TsRestRequestHandler } from "@ts-rest/express";
import { AppRoute, AppRouter } from "@ts-rest/core";
import { verifyAccessToken } from "../utils/auth";
import { db } from "../dal/db";
import { sessions } from "../dal/db/schemas/sessions";
import { eq } from "drizzle-orm";

const GUEST_TOKEN = { type: "None" as const, id: "", sessionId: "", username: "guest", role: "guest" };

export function authenticateTsRestRequest<
    T extends AppRouter | AppRoute,
>(): TsRestRequestHandler<T> {
    return async (
        req: any,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        let token = req.headers.authorization?.split(" ")[1];

        if (!token && req.cookies && req.cookies.access_token) {
            token = req.cookies.access_token;
        }

        try {
            if (token) {
                try {
                    const decoded = verifyAccessToken(token);

                    // Verify the session still exists in the DB (covers logout-all / ban)
                    if (decoded.sessionId) {
                        const [session] = await db
                            .select({ id: sessions.id })
                            .from(sessions)
                            .where(eq(sessions.id, decoded.sessionId));

                        if (!session) {
                            req.ctx = { ...req.ctx, decodedToken: GUEST_TOKEN };
                            next();
                            return;
                        }
                    }

                    req.ctx = {
                        ...req.ctx,
                        decodedToken: {
                            ...decoded,
                            type: "Bearer"
                        }
                    };
                } catch {
                    req.ctx = { ...req.ctx, decodedToken: GUEST_TOKEN };
                }
            } else {
                req.ctx = { ...req.ctx, decodedToken: GUEST_TOKEN };
            }
            next();
        } catch (error) {
            next(error);
        }
    };
}
