import { pgTable, serial, text, timestamp, integer, boolean, jsonb, unique, varchar, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';
import { supportedGameEnum } from './enums';

export const gameProfiles = pgTable('game_profiles', {
    id: serial('id').primaryKey(),

    userId: uuid('user_id').references(() => users.id).notNull(),

    game: supportedGameEnum('game').notNull(),

    gameIdentifier: varchar('game_identifier', { length: 255 }).notNull(),

    rank: varchar('rank', { length: 50 }).default('Unranked'),
    level: integer('level').default(0),

    isVerified: boolean('is_verified').default(false).notNull(),
    verificationProof: text('verification_proof'),

    isVisible: boolean('is_visible').default(true).notNull(),

    metadata: jsonb('metadata').default({}).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
    uniqueUserGame: unique().on(t.userId, t.game),
    uniqueGameIdentity: unique().on(t.game, t.gameIdentifier),
}));

