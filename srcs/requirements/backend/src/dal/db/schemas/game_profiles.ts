import { pgTable, text, timestamp, uuid, jsonb, unique } from 'drizzle-orm/pg-core';
import { users } from './users';
import { sports } from './sports'; // Import the new sports catalog

export const gameProfiles = pgTable('game_profiles', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    
    // THE FIX: Replaced the enum with a relation to the universal sports table
    sportId: uuid('sport_id').references(() => sports.id, { onDelete: 'cascade' }).notNull(),
    
    // The user's in-game name, Riot ID, or Steam ID for this specific sport/game
    gameIdentifier: text('game_identifier').notNull(),
    
    // Store flexible data like ranks, ELO, or API sync tokens here
    metadata: jsonb('metadata').default({}).notNull(),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
    // Ensure a user can only have one profile per sport (e.g., one League of Legends account linked)
    uniqueProfile: unique().on(table.userId, table.sportId),
}));
