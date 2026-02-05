import { pgTable, serial, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { tournaments } from './tournaments';
import { matchStatusEnum } from './enums';

export const matches = pgTable('matches', {
    id: serial('id').primaryKey(),
    tournamentId: integer('tournament_id').references(() => tournaments.id).notNull(),

    // Participants
    participant1Id: integer('participant1_id'),
    participant2Id: integer('participant2_id'),

    // Results
    score1: integer('score1').default(0),
    score2: integer('score2').default(0),
    winnerId: integer('winner_id'),

    // Match State
    status: matchStatusEnum('status').default('pending').notNull(),
    round: integer('round').notNull(),
    position: integer('position').notNull(),

    // Bracket logic
    nextMatchId: integer('next_match_id'),

    // Advanced Stats
    matchStats: jsonb('match_stats').default({}).notNull(),

    scheduledAt: timestamp('scheduled_at'),
    completedAt: timestamp('completed_at'),
});
