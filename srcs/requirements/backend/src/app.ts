import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { addApiRoutes } from "./api/router";
import { compatibilityCheckMiddleware } from "./middlewares/compatibilityCheck";
import contextMiddleware from "./middlewares/context";
import errorHandlingMiddleware from "./middlewares/error";
import { rootRateLimiter } from "./middlewares/rate-limit";
import { contract, COMPATIBILITY_CHECK_HEADER } from "@ft-transcendence/contracts";
import { generateOpenApi } from "@ts-rest/open-api";
import swaggerUi from "swagger-ui-express";

function buildApp(): express.Application {
    const app = express();

    // Generate OpenAPI Document from ts-rest contract
    const openApiDocument = generateOpenApi(contract, {
        info: {
            title: "Tournify API",
            version: "1.0.0",
            description: "Interactive documentation for the Tournify backend API.",
        },
        servers: [
            {
                url: "/api",
                description: "Default API Gateway",
            },
        ],
        options: {
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
        }
    });

    console.log("[INFO] Regenerated OpenAPI documentation from contracts.");

    // Body parsing, cookies, CORS, and security headers
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

    // Mount Swagger UI
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

    // Static file serving for uploads (before auth/rate-limit)
    app.use("/api/uploads", express.static(path.join(process.cwd(), "uploads")));

    // API Routes via ts-rest contract
    addApiRoutes(app);

    // Global Error Handler (must be last)
    app.use(errorHandlingMiddleware);

    return app;
}

export default buildApp();
