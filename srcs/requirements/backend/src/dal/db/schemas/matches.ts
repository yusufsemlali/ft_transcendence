import { pgTable, uuid, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { tournaments } from './tournaments';
import { matchStatusEnum } from './enums';

export const matches = pgTable('matches', {
    id: uuid('id').primaryKey().defaultRandom(),
    tournamentId: uuid('tournament_id').references(() => tournaments.id, { onDelete: 'cascade' }).notNull(),

    // We keep these as integer for now if they are intended to be simple relative ids (like "Player 1"), 
    // but usually in this dynamic system, participant IDs should also be UUIDs referencing users or teams.
    // Given the move to UUIDs for users/orgs, these should definitely be UUIDs as well.
    participant1Id: uuid('participant1_id'),
    participant2Id: uuid('participant2_id'),

    score1: integer('score1').default(0),
    score2: integer('score2').default(0),
    winnerId: uuid('winner_id'),

    status: matchStatusEnum('status').default('pending').notNull(),
    round: integer('round').notNull(),
    position: integer('position').notNull(),

    nextMatchId: uuid('next_match_id'),

    matchStats: jsonb('match_stats').default({}).notNull(),
    matchConfigSchema: jsonb('match_config_schema').default({}).notNull(),

    scheduledAt: timestamp('scheduled_at'),
    completedAt: timestamp('completed_at'),
});
