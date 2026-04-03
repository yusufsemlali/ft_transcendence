import { pgTable, text, timestamp, integer, varchar, boolean, jsonb, uuid } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { sports } from './sports';
import { tournamentStatusEnum, bracketTypeEnum } from './enums';

export const tournaments = pgTable('tournaments', {
    id: uuid('id').primaryKey().defaultRandom(),

    // Hierarchical Links
    organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
    sportId: uuid('sport_id').references(() => sports.id).notNull(),

    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 120 }).notNull().unique(),
    description: text('description'),

    // Logic
    status: tournamentStatusEnum('status').default('draft').notNull(),
    bracketType: bracketTypeEnum('bracket_type').default('single_elimination').notNull(),
    maxParticipants: integer('max_participants').notNull(),

    // Access & Logistics
    isPrivate: boolean('is_private').default(false).notNull(),
    joinCode: varchar('join_code', { length: 20 }),
    prizePool: text('prize_pool'),
    entryFee: integer('entry_fee').default(0),
    bannerUrl: text('banner_url'),

    // Scheduling
    registrationOpensAt: timestamp('registration_opens_at'),
    registrationClosesAt: timestamp('registration_closes_at'),
    startsAt: timestamp('starts_at'),
    endsAt: timestamp('ends_at'),

    // The Ultimate Escape Hatch
    // Store sport-specific configs here (e.g., { "setsToWin": 3, "mapPool": ["Dust2", "Mirage"] })
    metadata: jsonb('metadata').default({}).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
});
