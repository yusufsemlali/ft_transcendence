import { pgTable, text, timestamp, varchar, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { users } from './users';

// The Organization (School, Club, Hobby Group)
export const organizations = pgTable('organizations', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 120 }).notNull().unique(),
    description: text('description'),
    logoUrl: text('logo_url'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Junction table: one User can be 'owner' of their School, but just 'member' of a local Club
export const organizationMembers = pgTable('organization_members', {
    organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

    // role: 'owner', 'admin', 'referee', 'member'
    role: varchar('role', { length: 50 }).default('member').notNull(),

    joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.organizationId, table.userId] }),
}));
