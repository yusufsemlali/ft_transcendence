import express from "express";
import cors from "cors";
import helmet from "helmet";

function buildApp(): express.Application {
    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cors({
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true
    }));
    app.use(helmet());

    app.set("trust proxy", 1);

    // Placeholder for routes
    app.get("/api/health", (req, res) => {
        res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    return app;
}

export default buildApp();
