import { pgTable, uuid, varchar, boolean } from 'drizzle-orm/pg-core';
import { scoringTypeEnum } from './enums';

// Dynamic Sports Catalog — no code changes needed to add new sports
export const sports = pgTable('sports', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull().unique(),     // e.g., 'Valorant', 'Basketball', 'Swimming 100m'
    category: varchar('category', { length: 50 }).notNull(),       // e.g., 'esports', 'physical', 'tabletop'

    // The core business logic hook
    scoringType: scoringTypeEnum('scoring_type').default('points_high').notNull(),

    // Does this sport support teams or just individuals?
    isTeamBased: boolean('is_team_based').default(true).notNull(),
});
