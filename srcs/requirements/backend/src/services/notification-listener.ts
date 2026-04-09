import pg from "pg";
import { Response } from "express";

const sseClients = new Map<string, Set<Response>>();

export function addSseClient(userId: string, res: Response): void {
    let clients = sseClients.get(userId);
    if (!clients) {
        clients = new Set();
        sseClients.set(userId, clients);
    }
    clients.add(res);
}

export function removeSseClient(userId: string, res: Response): void {
    const clients = sseClients.get(userId);
    if (!clients) return;
    clients.delete(res);
    if (clients.size === 0) {
        sseClients.delete(userId);
    }
}

interface NotificationPayload {
    userId: string;
    type?: string;
    refId?: string | null;
}

function pushToUser(payload: NotificationPayload): void {
    const clients = sseClients.get(payload.userId);
    if (!clients || clients.size === 0) return;

    const frame = `event: notification\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const res of clients) {
        res.write(frame);
    }
}

async function ensureNotifyTrigger(client: pg.Client): Promise<void> {
    await client.query(`
        CREATE OR REPLACE FUNCTION notify_new_notification() RETURNS trigger AS $$
        BEGIN
            PERFORM pg_notify('notifications', json_build_object(
                'userId', NEW.user_id,
                'type', NEW.type,
                'refId', NEW.ref_id
            )::text);
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `);

    await client.query(`
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notify_new_notification'
            ) THEN
                CREATE TRIGGER trg_notify_new_notification
                    AFTER INSERT ON notifications
                    FOR EACH ROW
                    EXECUTE FUNCTION notify_new_notification();
            END IF;
        END $$;
    `);
}

async function connectAndListen(): Promise<void> {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    await ensureNotifyTrigger(client);

    await client.query("LISTEN notifications");
    console.log("[notifications] LISTEN active on channel 'notifications'");

    client.on("notification", (msg: pg.Notification) => {
        if (msg.channel === "notifications" && msg.payload) {
            try {
                const parsed = JSON.parse(msg.payload) as NotificationPayload;
                pushToUser(parsed);
            } catch {
                pushToUser({ userId: msg.payload });
            }
        }
    });

    client.on("error", (err: Error) => {
        console.error("[notifications] Connection error, will reconnect:", err.message);
        client.end().catch(() => {});
        scheduleReconnect();
    });

    client.on("end", () => {
        console.warn("[notifications] Connection ended, will reconnect");
        scheduleReconnect();
    });
}

let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = 1000;
const MAX_RECONNECT_DELAY = 30000;

function scheduleReconnect(): void {
    if (reconnectTimer) return;
    console.log(`[notifications] Reconnecting in ${reconnectDelay}ms...`);
    reconnectTimer = setTimeout(async () => {
        reconnectTimer = null;
        try {
            await connectAndListen();
            reconnectDelay = 1000;
        } catch (err) {
            console.error("[notifications] Reconnect failed:", (err as Error).message);
            reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
            scheduleReconnect();
        }
    }, reconnectDelay);
}

export async function startNotificationListener(): Promise<void> {
    try {
        await connectAndListen();
    } catch (err) {
        console.error("[notifications] Initial connection failed:", (err as Error).message);
        scheduleReconnect();
    }
}
