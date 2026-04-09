import { pgTable, pgEnum, uuid, varchar, timestamp, unique, integer } from 'drizzle-orm/pg-core';
import { users } from './users';
import { tournaments } from './tournaments';

// --- ENUMS ---
export const lobbyStatusEnum = pgEnum('lobby_status', [
    'solo',      // LFT / Just chilling
    'rostered',   // Successfully joined a competitor group
    'spectator'   // Downgraded after registration closes if not rostered
]);

export const competitorStatusEnum = pgEnum('competitor_status', [
    'incomplete', // Has players, but not enough to meet minTeamSize
    'ready',      // Fully legal roster, ready for bracket logic
    'disqualified' // TO manually disqualified them or failed to meet requirements
]);

export const inviteStatusEnum = pgEnum('invite_status', [
    'pending',
    'accepted',
    'declined'
]);

export const rosterRoleEnum = pgEnum('roster_role', [
    'captain',
    'player',
    'substitute'
]);

// --- 1. THE LOBBY (Humans in the room) ---
export const lobby = pgTable('lobby', {
    id: uuid('id').primaryKey().defaultRandom(),
    tournamentId: uuid('tournament_id').references(() => tournaments.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    status: lobbyStatusEnum('status').default('solo').notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (t: any) => ({
    unqPlayer: unique().on(t.tournamentId, t.userId)
}));

// --- 2. COMPETITORS (The actual bracket actors) ---
export const competitors = pgTable('competitors', {
    id: uuid('id').primaryKey().defaultRandom(),
    tournamentId: uuid('tournament_id').references(() => tournaments.id, { onDelete: 'cascade' }).notNull(),
    name: varchar('name', { length: 255 }).notNull(), // User's name for 1v1s, Team name for 5v5s
    status: competitorStatusEnum('status').default('incomplete').notNull(),
    seed: integer('seed'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- 3. ROSTERS (Linking Lobby Humans to Competitors) ---
export const rosters = pgTable('rosters', {
    id: uuid('id').primaryKey().defaultRandom(),
    competitorId: uuid('competitor_id').references(() => competitors.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    role: rosterRoleEnum('role').default('player').notNull(),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (t: any) => ({
    unqRoster: unique().on(t.competitorId, t.userId)
}));

// --- 4. INVITES (Tracking specific RELATIONAL invites) ---
export const invites = pgTable('invites', {
    id: uuid('id').primaryKey().defaultRandom(),
    tournamentId: uuid('tournament_id').references(() => tournaments.id, { onDelete: 'cascade' }).notNull(),
    competitorId: uuid('competitor_id').references(() => competitors.id, { onDelete: 'cascade' }).notNull(),
    inviterId: uuid('inviter_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    targetUserId: uuid('target_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    status: inviteStatusEnum('status').default('pending').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table: any) => ({
    unqInvite: unique().on(table.competitorId, table.targetUserId)
}));

