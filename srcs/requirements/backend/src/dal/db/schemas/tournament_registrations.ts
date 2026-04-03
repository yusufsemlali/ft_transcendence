import { pgTable, serial, integer, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { tournaments } from './tournaments';
import { users } from './users';

export const tournamentRegistrations = pgTable('tournament_registrations', {
    id: serial('id').primaryKey(),
    tournamentId: integer('tournament_id').references(() => tournaments.id).notNull(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
    unq: unique().on(t.tournamentId, t.userId), // remember achraf this is the rule
}));
