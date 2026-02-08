import { uuid, text, timestamp } from "drizzle-orm/pg-core";
import { authSchema } from "./auth";
import { users } from "./users";

export const identities = authSchema.table("identities", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerId: text("provider_id").notNull(),
    identityData: text("identity_data"),
    lastSignInAt: timestamp("last_sign_in_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
