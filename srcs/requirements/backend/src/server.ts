import "dotenv/config";
import app from "./app";
import { Server } from "http";
import { startNotificationListener } from "./services/notification-listener";

async function bootServer(port: number): Promise<Server> {
    try {
        console.log(`Starting server in ${process.env.NODE_ENV} mode...`);

        return app.listen(port, "0.0.0.0", () => {
            console.log(`
╔═══════════════════════════════════════════╗
║     ft_transcendence Backend Started      ║
║                                           ║
║  Internal Port: ${port}                      ║
║  Access via NGINX: https://localhost:8080 ║
╚═══════════════════════════════════════════╝
            `);
            startNotificationListener();
        });
    } catch (error) {
        console.error("Failed to boot server:", error);
        return process.exit(1);
    }
}

const PORT = parseInt(process.env.PORT ?? "8080", 10);

bootServer(PORT);
