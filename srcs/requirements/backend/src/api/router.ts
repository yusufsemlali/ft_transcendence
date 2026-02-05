import { createExpressEndpoints } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import { tournamentsController } from "./controllers/tournaments.controller";
import { authController } from "./controllers/auth.controller";
import { usersController } from "./controllers/users.controller";
import { settingsController } from "./controllers/settings.controller";
import { Express } from "express";
import { authenticateTsRestRequest } from "@/middlewares/auth";

export const addApiRoutes = (app: Express) => {
    createExpressEndpoints(contract, {
        tournaments: tournamentsController,
        auth: authController,
        users: usersController,
        settings: settingsController,
    }, app, {
        globalMiddleware: [
            authenticateTsRestRequest()
        ]
    });
};
