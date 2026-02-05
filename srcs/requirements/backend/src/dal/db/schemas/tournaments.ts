import { pgTable, serial, text, timestamp, integer, varchar, boolean, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { tournamentStatusEnum, bracketTypeEnum } from './enums';

export const tournaments = pgTable('tournaments', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 120 }).notNull().unique(),
    description: text('description'),
    organizerId: integer('organizer_id').references(() => users.id).notNull(),

    // Format
    status: tournamentStatusEnum('status').default('draft').notNull(),
    bracketType: bracketTypeEnum('bracket_type').default('single_elimination').notNull(),

    // Limits
    maxParticipants: integer('max_participants').notNull(),
    isPrivate: boolean('is_private').default(false).notNull(),
    joinCode: varchar('join_code', { length: 20 }),

    // Media & Logistics
    prizePool: text('prize_pool'),
    entryFee: integer('entry_fee').default(0),
    bannerUrl: text('banner_url'),

    // Schedule
    registrationOpensAt: timestamp('registration_opens_at'),
    registrationClosesAt: timestamp('registration_closes_at'),
    startsAt: timestamp('starts_at'),
    endsAt: timestamp('ends_at'),

    metadata: jsonb('metadata').default({}).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
