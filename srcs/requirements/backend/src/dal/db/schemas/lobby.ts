import { pgTable, pgEnum, uuid, varchar, timestamp, unique, integer } from 'drizzle-orm/pg-core';
import { users } from './users';
import { tournaments } from './tournaments';

// --- ENUMS ---
export const lobbyStatusEnum = pgEnum('lobby_status', [
    'solo',      // LFT / Just chilling in the lobby
    'invited',   // Pending an invite to an entrant group
    'rostered'   // Successfully joined an entrant group
]);

export const entrantStatusEnum = pgEnum('entrant_status', [
    'incomplete', // Has players, but not enough to meet minTeamSize
    'ready',      // Fully legal roster, ready for bracket logic
    'disqualified' // TO manually disqualified them
]);

export const rosterRoleEnum = pgEnum('roster_role', [
    'captain',
    'player',
    'substitute'
]);

// --- 1. THE LOBBY POOL (Humans in the building) ---
export const tournamentPlayers = pgTable('tournament_players', {
    id: uuid('id').primaryKey().defaultRandom(),
    tournamentId: uuid('tournament_id').references(() => tournaments.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    status: lobbyStatusEnum('status').default('solo').notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (t: any) => ({
    // A user can only be in the lobby for a specific tournament once
    unqPlayer: unique().on(t.tournamentId, t.userId)
}));

// --- 2. COMPETITIVE UNITS (The actual bracket actors) ---
export const tournamentEntrants = pgTable('tournament_entrants', {
    id: uuid('id').primaryKey().defaultRandom(),
    tournamentId: uuid('tournament_id').references(() => tournaments.id, { onDelete: 'cascade' }).notNull(),
    name: varchar('name', { length: 255 }).notNull(), // User's name for 1v1s, Team name for 5v5s
    status: entrantStatusEnum('status').default('incomplete').notNull(),
    seed: integer('seed'), // Optional: To support TO seeding mechanisms
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- 3. ROSTER JUNCTION (Linking Lobby Humans to Competitive Units) ---
export const entrantRosters = pgTable('entrant_rosters', {
    id: uuid('id').primaryKey().defaultRandom(),
    entrantId: uuid('entrant_id').references(() => tournamentEntrants.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    role: rosterRoleEnum('role').default('player').notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (t: any) => ({
    unqRoster: unique().on(t.entrantId, t.userId)
}));

// --- 4. TEAM INVITES (Tracking specific RELATIONAL invites) ---
export const tournamentInvites = pgTable('tournament_invites', {
    id: uuid('id').primaryKey().defaultRandom(),
    tournamentId: uuid('tournament_id').references(() => tournaments.id, { onDelete: 'cascade' }).notNull(),
    teamId: uuid('team_id').references(() => tournamentEntrants.id, { onDelete: 'cascade' }).notNull(),
    inviterId: uuid('inviter_id').references(() => users.id).notNull(),
    targetUserId: uuid('target_user_id').references(() => users.id).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table: any) => ({
    unqInvite: unique().on(table.teamId, table.targetUserId)
}));
