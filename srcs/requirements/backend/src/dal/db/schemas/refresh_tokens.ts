import { uuid, text, timestamp, boolean, bigserial } from "drizzle-orm/pg-core";
import { authSchema } from "./auth";
import { sessions } from "./sessions";

export const refreshTokens = authSchema.table("refresh_tokens", {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    sessionId: uuid("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    parent: text("parent"),
    revoked: boolean("revoked").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
