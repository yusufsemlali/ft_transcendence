import { createExpressEndpoints } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import { tournamentsController } from "./controllers/tournaments.controller";
import { authController } from "./controllers/auth.controller";
import { usersController } from "./controllers/users.controller";
import { Express } from "express";

export const addApiRoutes = (app: Express) => {
    createExpressEndpoints(contract, {
        tournaments: tournamentsController,
        auth: authController,
        users: usersController,
    }, app);
};
