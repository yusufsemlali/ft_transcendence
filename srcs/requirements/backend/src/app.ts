import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { addApiRoutes } from "./api/router";
import { compatibilityCheckMiddleware } from "./middlewares/compatibilityCheck";
import contextMiddleware from "./middlewares/context";
import errorHandlingMiddleware from "./middlewares/error";
import { authRateLimiter, rootRateLimiter } from "./middlewares/rate-limit";
import { COMPATIBILITY_CHECK_HEADER } from "@ft-transcendence/contracts";

function buildApp(): express.Application {
    console.log("init server");
    const app = express();

    // Standard Middlewares
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use(cors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
        exposedHeaders: [COMPATIBILITY_CHECK_HEADER]
    }));
    app.use(helmet());

    app.set("trust proxy", 1);

    // Monkeytype-style Middlewares
    app.use(compatibilityCheckMiddleware);
    app.use(contextMiddleware);
    app.use(rootRateLimiter);
    app.use(authRateLimiter)

    // API Routes via ts-rest contract
    addApiRoutes(app);

    // Global Error Handler (must be last)
    app.use(errorHandlingMiddleware);

    return app;
}

export default buildApp();
