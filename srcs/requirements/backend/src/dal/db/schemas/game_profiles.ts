import { pgTable, serial, text, timestamp, integer, boolean, jsonb, unique, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';
import { supportedGameEnum } from './enums';

// The Generalized "Muscle" Table
// One table to rule all games.
// Uses a JSONB 'metadata' column for game-specific stats (KDA for League, Headshot% for CS2).
export const gameProfiles = pgTable('game_profiles', {
    id: serial('id').primaryKey(),

    // The Human Behind the Screen
    userId: integer('user_id').references(() => users.id).notNull(),

    // The Game They Play (Enum ensures validity)
    game: supportedGameEnum('game').notNull(),

    // The Identity in THAT Game (The Crucial Part)
    // - For League: Riot ID (e.g., "Faker#KR1")
    // - For CS2/Dota: Steam ID (e.g., "76561198000000000")
    // - For Overwatch: BattleTag (e.g., "Player#1234")
    // This MUST be unique per game to prevent smurfing/alting on the same platform
    gameIdentifier: varchar('game_identifier', { length: 255 }).notNull(),

    // Skill Representation
    // Generalized 'rank' string (e.g., "Gold IV" or "Global Elite")
    rank: varchar('rank', { length: 50 }).default('Unranked'),
    level: integer('level').default(0),

    // Verification & Integrity
    // You cannot let a user join a generic tournament without verifying they have the specific game account.
    isVerified: boolean('is_verified').default(false).notNull(),
    verificationProof: text('verification_proof'), // Could be a link to a screenshot, OAuth token ref, or third-party API verification ID

    // Privacy & Display
    isVisible: boolean('is_visible').default(true).notNull(), // Let users hide profiles they don't want public

    // Game Specific Metadata (The "Flexibility")
    // A flexible JSONB column to store game-specific stats without altering the schema.
    // Example for League: { "main_role": "Mid", "favorite_champions": ["Ahri", "Zed"], "win_rate": "54%" }
    // Example for CS2: { "favorite_map": "Mirage", "adr": 85.5, "headshot_percentage": "45%" }
    metadata: jsonb('metadata').default({}).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
    // A user can only have ONE profile per game to prevent abuse
    // If they want to change accounts, they update this single entry.
    uniqueUserGame: unique().on(t.userId, t.game),
    // Ensure a game identifier is unique within a specific game (e.g., two users can't claim the same Riot ID)
    uniqueGameIdentity: unique().on(t.game, t.gameIdentifier),
}));
