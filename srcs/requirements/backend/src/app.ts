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
import { verifyAccessToken } from "./utils/auth";
import { addSseClient, removeSseClient } from "./services/notification-listener";
import { addLobbyStreamClient, removeLobbyStreamClient } from "./services/lobby-sse";

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

    // Mount Swagger UI (Before Helmet to avoid CSP conflicts)
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument, {
        swaggerOptions: {
            persistAuthorization: true,
        },
        customSiteTitle: "Tournify API Documentation",
    }));

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

    // Static file serving for uploads (before auth/rate-limit)
    app.use("/api/uploads", express.static("/app/uploads"));

    // SSE endpoint for real-time notification push
    app.get("/api/notifications/stream", (req, res) => {
        const token = req.cookies?.access_token
            || req.headers.authorization?.split(" ")[1];

        if (!token) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        let userId: string;
        try {
            const decoded = verifyAccessToken(token);
            userId = decoded.id;
        } catch {
            res.status(401).json({ message: "Invalid token" });
            return;
        }

        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        });
        res.write(": connected\n\n");

        addSseClient(userId, res);

        const heartbeat = setInterval(() => {
            res.write(": heartbeat\n\n");
        }, 30_000);

        req.on("close", () => {
            clearInterval(heartbeat);
            removeSseClient(userId, res);
        });
    });

    /** SSE: push when lobby/roster/invites change for a tournament (replaces client polling) */
    app.get("/api/tournaments/:id/lobby/stream", (req, res) => {
        const token = req.cookies?.access_token
            || req.headers.authorization?.split(" ")[1];

        if (!token) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        try {
            verifyAccessToken(token);
        } catch {
            res.status(401).json({ message: "Invalid token" });
            return;
        }

        const tournamentId = req.params.id;
        if (!tournamentId) {
            res.status(400).json({ message: "Missing tournament id" });
            return;
        }

        res.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        });
        res.write(": connected\n\n");

        addLobbyStreamClient(tournamentId, res);

        const heartbeat = setInterval(() => {
            res.write(": heartbeat\n\n");
        }, 30_000);

        req.on("close", () => {
            clearInterval(heartbeat);
            removeLobbyStreamClient(tournamentId, res);
        });
    });

    // API Routes via ts-rest contract
    addApiRoutes(app);

    // Global Error Handler (must be last)
    app.use(errorHandlingMiddleware);

    return app;
}

export default buildApp();
