import { createExpressEndpoints } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import { tournamentsController } from "./controllers/tournaments.controller";
import { authController } from "./controllers/auth.controller";
import { usersController } from "./controllers/users.controller";
import { settingsController } from "./controllers/settings.controller";
import { userLinksController } from "./controllers/user-links.controller";
import { organizationsController } from "./controllers/organizations.controller";
import { adminController } from "./controllers/admin.controller";
import { sportsController } from "./controllers/sports.controller";
import { chatController } from "./controllers/chat.controller";
import { friendsController } from "./controllers/friends.controller";
import { matchesController } from "./controllers/matches.controller";
import { filesController } from "./controllers/files.controller";
import { notificationsController } from "./controllers/notifications.controller";
import { gdprController } from "./controllers/gdpr.controller";
import { Router, Express, Request, Response, NextFunction } from "express";
import { authenticateTsRestRequest } from "@/middlewares/auth";
import { uploadRateLimiter } from "@/middlewares/rate-limit";

export const addApiRoutes = (app: Express) => {
    const apiRouter = Router();

    // Specific rate limiting for heavy endpoints
    apiRouter.use("/files/upload", uploadRateLimiter);

    // Debug logging middleware
    apiRouter.use((req: Request, _res: Response, next: NextFunction) => {
        console.log(`[API] ${req.method} ${req.path}`);
        console.log("[API] Body:", JSON.stringify(req.body, null, 2));
        console.log("-------------------------------------------\n")
        next();
    });

    createExpressEndpoints(contract, {
        tournaments: tournamentsController,
        auth: authController,
        users: usersController,
        settings: settingsController,
        handles: userLinksController,
        organizations: organizationsController,
        chat: chatController,
        admin: adminController,
        sports: sportsController,
        friends: friendsController,
        matches: matchesController,
        files: filesController,
        notifications: notificationsController,
        gdpr: gdprController,
    }, apiRouter, {
        jsonQuery: true,
        globalMiddleware: [
            authenticateTsRestRequest()
        ],
        requestValidationErrorHandler: (err, req, res) => {
            console.log("\n\n[API] Validation Error:", JSON.stringify(err, null, 2));
            res.status(400).json({
                message: "Validation failed",
                errors: err.body?.issues || err.body || err,
            });
        },
    });

    app.use("/api", apiRouter);
};
