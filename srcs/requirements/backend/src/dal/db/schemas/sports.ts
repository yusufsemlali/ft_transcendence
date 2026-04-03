import { pgTable, uuid, varchar, boolean, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { scoringTypeEnum, sportModeEnum, sportCategoryEnum } from './enums';

export const sports = pgTable('sports', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    category: sportCategoryEnum('category').notNull(),
    
    // --- IMMUTABLE RULES (Archetype) ---
    scoringType: scoringTypeEnum('scoring_type').default('points_high').notNull(),
    mode: sportModeEnum('mode').default('team').notNull(),
    requiredHandleType: varchar('required_handle_type', { length: 50 }), // e.g., 'riot_id'

    // --- BLUEPRINT DEFAULTS (Overridable by TO) ---
    // We use integer nulls here to allow "flexible" defaults if needed.
    defaultMinTeamSize: integer('default_min_team_size'),
    defaultMaxTeamSize: integer('default_max_team_size'),
    defaultHasDraws: boolean('default_has_draws').default(false).notNull(),

    // --- ENGINE SCHEMAS (Instructions for FE) ---
    tournamentConfigSchema: jsonb('tournament_config_schema').default({}).notNull(),
    matchConfigSchema: jsonb('match_config_schema').default({}).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
