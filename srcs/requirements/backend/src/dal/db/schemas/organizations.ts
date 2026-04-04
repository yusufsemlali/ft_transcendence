import { pgTable, text, timestamp, varchar, uuid, primaryKey, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { orgRoleEnum } from './enums';

export const organizations = pgTable('organizations', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 120 }).notNull().unique(),
    description: text('description'),
    logoUrl: text('logo_url'),
    visibility: varchar('visibility', { enum: ['public', 'private'] }).default('public').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
});

export const organizationMembers = pgTable('organization_members', {
    organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

    // role: 'owner', 'admin', 'referee', 'member'
    role: orgRoleEnum('role').default('member').notNull(),

    joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.organizationId, table.userId] }),
    idxUser: index('idx_org_members_user').on(table.userId),
    idxOrg: index('idx_org_members_org').on(table.organizationId),
    // 🛡️ THE BULLETPROOF RULE: Exactly one owner per organization
    uniqueOwner: uniqueIndex('unique_owner_per_org')
      .on(table.organizationId)
      .where(sql`role = 'owner'`),
}));
