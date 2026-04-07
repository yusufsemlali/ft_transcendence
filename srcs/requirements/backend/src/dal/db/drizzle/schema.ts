import { pgTable, pgSchema, foreignKey, uuid, text, timestamp, unique, boolean, uniqueIndex, varchar, jsonb, integer, real, inet, index, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const auth = pgSchema("auth");
export const bracketType = pgEnum("bracket_type", ['single_elimination', 'double_elimination', 'round_robin', 'swiss', 'free_for_all'])
export const entrantStatus = pgEnum("entrant_status", ['incomplete', 'ready', 'disqualified'])
export const friendshipStatus = pgEnum("friendship_status", ['pending', 'accepted', 'blocked'])
export const lobbyStatus = pgEnum("lobby_status", ['solo', 'invited', 'rostered'])
export const matchStatus = pgEnum("match_status", ['pending', 'ongoing', 'completed', 'disputed', 'cancelled'])
export const notificationType = pgEnum("notification_type", ['friend_request', 'tournament_invite', 'match_starting', 'achievement_unlocked', 'system_alert'])
export const orgRole = pgEnum("org_role", ['owner', 'admin', 'referee', 'member'])
export const rosterRole = pgEnum("roster_role", ['captain', 'player', 'substitute'])
export const scoringType = pgEnum("scoring_type", ['points_high', 'time_low', 'sets', 'binary', 'stocks'])
export const sportCategory = pgEnum("sport_category", ['esports', 'physical', 'tabletop'])
export const sportMode = pgEnum("sport_mode", ['1v1', 'team', 'ffa'])
export const tournamentStatus = pgEnum("tournament_status", ['draft', 'registration', 'upcoming', 'ongoing', 'completed', 'cancelled'])
export const userRole = pgEnum("user_role", ['user', 'admin', 'moderator', 'organizer'])
export const userStatus = pgEnum("user_status", ['active', 'suspended', 'banned', 'muted'])


export const linkedAccountsInAuth = auth.table("linked_accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	provider: text().notNull(),
	providerId: text("provider_id").notNull(),
	accountMetadata: text("account_metadata"),
	lastLoadedAt: timestamp("last_loaded_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "linked_accounts_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const refreshTokensInAuth = auth.table("refresh_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	token: text().notNull(),
	parent: text(),
	revoked: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [sessionsInAuth.id],
			name: "refresh_tokens_session_id_sessions_id_fk"
		}).onDelete("cascade"),
	unique("refresh_tokens_token_unique").on(table.token),
]);

export const friendships = pgTable("friendships", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	senderId: uuid("sender_id").notNull(),
	receiverId: uuid("receiver_id").notNull(),
	status: friendshipStatus().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("unq_friendship").using("btree", sql`LEAST(sender_id, receiver_id)`, sql`GREATEST(sender_id, receiver_id)`),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [usersInAuth.id],
			name: "friendships_sender_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.receiverId],
			foreignColumns: [usersInAuth.id],
			name: "friendships_receiver_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const tournaments = pgTable("tournaments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	sportId: uuid("sport_id").notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 120 }).notNull(),
	description: text(),
	scoringType: scoringType("scoring_type").notNull(),
	matchConfigSchema: jsonb("match_config_schema").notNull(),
	mode: sportMode().notNull(),
	minTeamSize: integer("min_team_size").notNull(),
	maxTeamSize: integer("max_team_size").notNull(),
	allowDraws: boolean("allow_draws").notNull(),
	requiredHandleType: varchar("required_handle_type", { length: 50 }),
	minParticipants: integer("min_participants").default(2).notNull(),
	maxParticipants: integer("max_participants").notNull(),
	status: tournamentStatus().default('draft').notNull(),
	bracketType: bracketType("bracket_type").default('single_elimination').notNull(),
	isPrivate: boolean("is_private").default(false).notNull(),
	joinCode: varchar("join_code", { length: 20 }),
	prizePool: text("prize_pool"),
	entryFee: integer("entry_fee").default(0),
	bannerUrl: text("banner_url"),
	registrationOpensAt: timestamp("registration_opens_at", { mode: 'string' }),
	registrationClosesAt: timestamp("registration_closes_at", { mode: 'string' }),
	startsAt: timestamp("starts_at", { mode: 'string' }),
	endsAt: timestamp("ends_at", { mode: 'string' }),
	customSettings: jsonb("custom_settings").default({}).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "tournaments_organization_id_organizations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sportId],
			foreignColumns: [sports.id],
			name: "tournaments_sport_id_sports_id_fk"
		}),
	unique("tournaments_slug_unique").on(table.slug),
]);

export const matches = pgTable("matches", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tournamentId: uuid("tournament_id").notNull(),
	participant1Id: uuid("participant1_id"),
	participant2Id: uuid("participant2_id"),
	score1: integer().default(0),
	score2: integer().default(0),
	winnerId: uuid("winner_id"),
	status: matchStatus().default('pending').notNull(),
	round: integer().notNull(),
	position: integer().notNull(),
	nextMatchId: uuid("next_match_id"),
	matchStats: jsonb("match_stats").default({}).notNull(),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.tournamentId],
			foreignColumns: [tournaments.id],
			name: "matches_tournament_id_tournaments_id_fk"
		}).onDelete("cascade"),
]);

export const userSettings = pgTable("user_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	theme: varchar({ length: 50 }).default('default').notNull(),
	customTheme: boolean("custom_theme").default(false).notNull(),
	customThemeColors: jsonb("custom_theme_colors"),
	fontFamily: varchar("font_family", { length: 50 }).default('roboto_mono').notNull(),
	fontSize: real("font_size").default(1).notNull(),
	customBackground: varchar("custom_background", { length: 2048 }),
	customBackgroundSize: varchar("custom_background_size", { length: 20 }).default('cover'),
	customBackgroundFilter: jsonb("custom_background_filter").default([0.5,0.2,2,1]).notNull(),
	smoothAnimations: boolean("smooth_animations").default(true).notNull(),
	showKeyboardShortcuts: boolean("show_keyboard_shortcuts").default(true).notNull(),
	compactMode: boolean("compact_mode").default(false).notNull(),
	themeMode: varchar("theme_mode", { length: 20 }).default('system').notNull(),
	soundEnabled: boolean("sound_enabled").default(true).notNull(),
	soundVolume: real("sound_volume").default(0.5).notNull(),
	desktopNotifications: boolean("desktop_notifications").default(false).notNull(),
	themeColor: varchar("theme_color", { length: 7 }).default('#e8366d').notNull(),
	colorHarmony: varchar("color_harmony", { length: 20 }).default('complementary').notNull(),
	borderRadius: real("border_radius").default(10).notNull(),
	glassBlur: real("glass_blur").default(12).notNull(),
	glassOpacity: real("glass_opacity").default(0.1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "user_settings_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("user_settings_user_id_unique").on(table.userId),
]);

export const usersInAuth = auth.table("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	username: varchar({ length: 24 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: text(),
	role: userRole().default('user').notNull(),
	status: userStatus().default('active').notNull(),
	displayName: varchar("display_name", { length: 50 }),
	bio: text(),
	tagline: varchar({ length: 100 }),
	avatar: text().default('https://cdn-icons-png.flaticon.com/512/149/149071.png').notNull(),
	banner: text(),
	xp: integer().default(0).notNull(),
	level: integer().default(1).notNull(),
	eloRating: integer("elo_rating").default(1000).notNull(),
	rankTier: varchar("rank_tier", { length: 20 }).default('Unranked'),
	fortytwoId: integer("fortytwo_id"),
	discordId: varchar("discord_id", { length: 50 }),
	isOnline: boolean("is_online").default(false).notNull(),
	lastActiveAt: timestamp("last_active_at", { mode: 'string' }).defaultNow().notNull(),
	statusMessage: varchar("status_message", { length: 140 }),
	twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
	twoFactorSecret: text("two_factor_secret"),
	preferredLanguage: varchar("preferred_language", { length: 5 }).default('en').notNull(),
	theme: varchar({ length: 10 }).default('dark').notNull(),
	metadata: jsonb().default({}).notNull(),
	emailConfirmedAt: timestamp("email_confirmed_at", { mode: 'string' }),
	lastSignInAt: timestamp("last_sign_in_at", { mode: 'string' }),
	bannedUntil: timestamp("banned_until", { mode: 'string' }),
	banReason: text("ban_reason"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_username_unique").on(table.username),
	unique("users_email_unique").on(table.email),
	unique("users_fortytwo_id_unique").on(table.fortytwoId),
	unique("users_discord_id_unique").on(table.discordId),
]);

export const handles = pgTable("handles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	sportId: uuid("sport_id").notNull(),
	handle: text().notNull(),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "handles_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.sportId],
			foreignColumns: [sports.id],
			name: "handles_sport_id_sports_id_fk"
		}).onDelete("cascade"),
	unique("handles_user_id_sport_id_unique").on(table.userId, table.sportId),
]);

export const sessionsInAuth = auth.table("sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	userAgent: text("user_agent"),
	ipAddress: inet("ip_address"),
	browserName: text("browser_name"),
	browserVersion: text("browser_version"),
	osName: text("os_name"),
	osVersion: text("os_version"),
	deviceType: text("device_type"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const organizations = pgTable("organizations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 120 }).notNull(),
	description: text(),
	logoUrl: text("logo_url"),
	visibility: varchar().default('public').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	unique("organizations_slug_unique").on(table.slug),
]);

export const sports = pgTable("sports", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	category: sportCategory().notNull(),
	scoringType: scoringType("scoring_type").default('points_high').notNull(),
	mode: sportMode().default('team').notNull(),
	requiredHandleType: varchar("required_handle_type", { length: 50 }),
	defaultMinTeamSize: integer("default_min_team_size"),
	defaultMaxTeamSize: integer("default_max_team_size"),
	defaultHasDraws: boolean("default_has_draws").default(false).notNull(),
	tournamentConfigSchema: jsonb("tournament_config_schema").default({}).notNull(),
	matchConfigSchema: jsonb("match_config_schema").default({}).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("sports_name_unique").on(table.name),
]);

export const tournamentEntrants = pgTable("tournament_entrants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tournamentId: uuid("tournament_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	status: entrantStatus().default('incomplete').notNull(),
	seed: integer(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tournamentId],
			foreignColumns: [tournaments.id],
			name: "tournament_entrants_tournament_id_tournaments_id_fk"
		}).onDelete("cascade"),
]);

export const entrantRosters = pgTable("entrant_rosters", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	entrantId: uuid("entrant_id").notNull(),
	userId: uuid("user_id").notNull(),
	role: rosterRole().default('player').notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.entrantId],
			foreignColumns: [tournamentEntrants.id],
			name: "entrant_rosters_entrant_id_tournament_entrants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "entrant_rosters_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("entrant_rosters_entrant_id_user_id_unique").on(table.entrantId, table.userId),
]);

export const tournamentPlayers = pgTable("tournament_players", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tournamentId: uuid("tournament_id").notNull(),
	userId: uuid("user_id").notNull(),
	status: lobbyStatus().default('solo').notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tournamentId],
			foreignColumns: [tournaments.id],
			name: "tournament_players_tournament_id_tournaments_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "tournament_players_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("tournament_players_tournament_id_user_id_unique").on(table.tournamentId, table.userId),
]);

export const organizationMembers = pgTable("organization_members", {
	organizationId: uuid("organization_id").notNull(),
	userId: uuid("user_id").notNull(),
	role: orgRole().default('member').notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_org_members_org").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	index("idx_org_members_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("unique_owner_per_org").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")).where(sql`(role = 'owner'::org_role)`),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "organization_members_organization_id_organizations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersInAuth.id],
			name: "organization_members_user_id_users_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.organizationId, table.userId], name: "organization_members_organization_id_user_id_pk"}),
]);
