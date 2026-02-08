import { pgTable, serial, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { tournaments } from './tournaments';
import { matchStatusEnum } from './enums';

export const matches = pgTable('matches', {
    id: serial('id').primaryKey(),
    tournamentId: integer('tournament_id').references(() => tournaments.id).notNull(),

    participant1Id: integer('participant1_id'),
    participant2Id: integer('participant2_id'),

    score1: integer('score1').default(0),
    score2: integer('score2').default(0),
    winnerId: integer('winner_id'),

    status: matchStatusEnum('status').default('pending').notNull(),
    round: integer('round').notNull(),
    position: integer('position').notNull(),

    nextMatchId: integer('next_match_id'),

    matchStats: jsonb('match_stats').default({}).notNull(),

    scheduledAt: timestamp('scheduled_at'),
    completedAt: timestamp('completed_at'),
});
