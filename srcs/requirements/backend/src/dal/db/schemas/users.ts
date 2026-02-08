import { text, timestamp, integer, boolean, jsonb, varchar, uuid } from 'drizzle-orm/pg-core';
import { authSchema } from './auth';
import { userRoleEnum } from './enums';

export const users = authSchema.table('users', {
    id: uuid('id').primaryKey().defaultRandom(),

    username: varchar('username', { length: 24 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: text('password'),
    role: userRoleEnum('role').default('user').notNull(),

    displayName: varchar('display_name', { length: 50 }),
    bio: text('bio'),
    tagline: varchar('tagline', { length: 100 }),
    avatar: text('avatar').notNull().default("https://cdn-icons-png.flaticon.com/512/149/149071.png"),
    banner: text('banner'),

    xp: integer('xp').default(0).notNull(),
    level: integer('level').default(1).notNull(),
    eloRating: integer('elo_rating').default(1000).notNull(),
    rankTier: varchar('rank_tier', { length: 20 }).default('Unranked'),

    fortytwoId: integer('fortytwo_id').unique(),
    discordId: varchar('discord_id', { length: 50 }).unique(),

    isOnline: boolean('is_online').default(false).notNull(),
    lastActiveAt: timestamp('last_active_at').defaultNow().notNull(),
    statusMessage: varchar('status_message', { length: 140 }),

    twoFactorEnabled: boolean('two_factor_enabled').default(false).notNull(),
    twoFactorSecret: text('two_factor_secret'),
    preferredLanguage: varchar('preferred_language', { length: 5 }).default('en'),
    theme: varchar('theme', { length: 10 }).default('dark'),

    metadata: jsonb('metadata').default({}).notNull(),

    emailConfirmedAt: timestamp('email_confirmed_at'),
    lastSignInAt: timestamp('last_sign_in_at'),
    bannedUntil: timestamp('banned_until'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
