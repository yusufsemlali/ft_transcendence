import { uuid, text, timestamp } from "drizzle-orm/pg-core";
import { authSchema } from "./auth";
import { users } from "./users";

export const linkedAccounts = authSchema.table("linked_accounts", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    
    // Auth provider (e.g., '42', 'discord', 'google')
    provider: text("provider").notNull(),
    providerId: text("provider_id").notNull(),
    
    accountMetadata: text("account_metadata"),
    lastLoadedAt: timestamp("last_loaded_at"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
