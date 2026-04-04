import { uuid, timestamp, text, inet } from "drizzle-orm/pg-core";
import { authSchema } from "./auth";
import { users } from "./users";

export const sessions = authSchema.table("sessions", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    userAgent: text("user_agent"),
    ipAddress: inet("ip_address"),
    browserName: text("browser_name"),
    browserVersion: text("browser_version"),
    osName: text("os_name"),
    osVersion: text("os_version"),
    deviceType: text("device_type"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"),
});
