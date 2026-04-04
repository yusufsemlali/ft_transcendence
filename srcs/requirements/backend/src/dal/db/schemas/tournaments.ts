import { pgTable, text, timestamp, integer, varchar, boolean, jsonb, uuid } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { sports } from './sports';
import { tournamentStatusEnum, bracketTypeEnum, sportModeEnum, scoringTypeEnum } from './enums';

export const tournaments = pgTable('tournaments', {
    id: uuid('id').primaryKey().defaultRandom(),

    // Hierarchical Links
    organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
    sportId: uuid('sport_id').references(() => sports.id).notNull(),

    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 120 }).notNull().unique(),
    description: text('description'),

    // --- THE HISTORICAL SNAPSHOTS ---
    // These are cloned directly from the sports table at the moment of creation.
    scoringType: scoringTypeEnum('scoring_type').notNull(),
    matchConfigSchema: jsonb('match_config_schema').notNull(),

    // --- THE TO's CUSTOM RULES (Instance Overrides from the Blueprint) ---
    mode: sportModeEnum('mode').notNull(),  // e.g., A Sport might be 'team' but TO says '1v1'
    minTeamSize: integer('min_team_size').notNull(),
    maxTeamSize: integer('max_team_size').notNull(),
    allowDraws: boolean('allow_draws').notNull(),
    requiredHandleType: varchar('required_handle_type', { length: 50 }),

    // --- CAPACITIES ---
    minParticipants: integer('min_participants').default(2).notNull(),
    maxParticipants: integer('max_participants').notNull(),

    // --- LOGISTICS & ACCESS ---
    status: tournamentStatusEnum('status').default('draft').notNull(),
    bracketType: bracketTypeEnum('bracket_type').default('single_elimination').notNull(),
    isPrivate: boolean('is_private').default(false).notNull(),
    joinCode: varchar('join_code', { length: 20 }),
    prizePool: text('prize_pool'),
    entryFee: integer('entry_fee').default(0),
    bannerUrl: text('banner_url'),

    // --- SCHEDULING ---
    registrationOpensAt: timestamp('registration_opens_at'),
    registrationClosesAt: timestamp('registration_closes_at'),
    startsAt: timestamp('starts_at'),
    endsAt: timestamp('ends_at'),

    // --- SPORT-SPECIFIC CUSTOM DATA ---
    customSettings: jsonb('custom_settings').default({}).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
