import { createExpressEndpoints } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import { tournamentsController } from "./controllers/tournaments.controller";
import { authController } from "./controllers/auth.controller";
import { usersController } from "./controllers/users.controller";
import { settingsController } from "./controllers/settings.controller";
import { gameProfilesController } from "./controllers/game-profiles.controller";
import { Router, Express, Request, Response, NextFunction } from "express";
import { authenticateTsRestRequest } from "@/middlewares/auth";

export const addApiRoutes = (app: Express) => {
    const apiRouter = Router();

    // Debug logging middleware
    apiRouter.use((req: Request, _res: Response, next: NextFunction) => {
        console.log(`[API] ${req.method} ${req.path}`);
        console.log("[API] Body:", JSON.stringify(req.body, null, 2));
        next();
    });

    createExpressEndpoints(contract, {
        tournaments: tournamentsController,
        auth: authController,
        users: usersController,
        settings: settingsController,
        gameProfiles: gameProfilesController,
    }, apiRouter, {
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
