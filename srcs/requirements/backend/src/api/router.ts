import { createExpressEndpoints } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import { tournamentsRouter } from "./controllers/tournaments.controller";
import { authController } from "./controllers/auth.controller";
import { Express } from "express";

export const addApiRoutes = (app: Express) => {
    createExpressEndpoints(contract, {
        tournaments: tournamentsRouter,
        auth: authController,
        // users: usersRouter will go here later
    }, app);
};
