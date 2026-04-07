import { relations } from "drizzle-orm/relations";
import { usersInAuth, linkedAccountsInAuth, sessionsInAuth, refreshTokensInAuth, friendships, organizations, tournaments, sports, matches, userSettings, handles, tournamentEntrants, entrantRosters, tournamentPlayers, organizationMembers } from "./schema";

export const linkedAccountsInAuthRelations = relations(linkedAccountsInAuth, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [linkedAccountsInAuth.userId],
		references: [usersInAuth.id]
	}),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	linkedAccountsInAuths: many(linkedAccountsInAuth),
	friendships_senderId: many(friendships, {
		relationName: "friendships_senderId_usersInAuth_id"
	}),
	friendships_receiverId: many(friendships, {
		relationName: "friendships_receiverId_usersInAuth_id"
	}),
	userSettings: many(userSettings),
	handles: many(handles),
	sessionsInAuths: many(sessionsInAuth),
	entrantRosters: many(entrantRosters),
	tournamentPlayers: many(tournamentPlayers),
	organizationMembers: many(organizationMembers),
}));

export const refreshTokensInAuthRelations = relations(refreshTokensInAuth, ({one}) => ({
	sessionsInAuth: one(sessionsInAuth, {
		fields: [refreshTokensInAuth.sessionId],
		references: [sessionsInAuth.id]
	}),
}));

export const sessionsInAuthRelations = relations(sessionsInAuth, ({one, many}) => ({
	refreshTokensInAuths: many(refreshTokensInAuth),
	usersInAuth: one(usersInAuth, {
		fields: [sessionsInAuth.userId],
		references: [usersInAuth.id]
	}),
}));

export const friendshipsRelations = relations(friendships, ({one}) => ({
	usersInAuth_senderId: one(usersInAuth, {
		fields: [friendships.senderId],
		references: [usersInAuth.id],
		relationName: "friendships_senderId_usersInAuth_id"
	}),
	usersInAuth_receiverId: one(usersInAuth, {
		fields: [friendships.receiverId],
		references: [usersInAuth.id],
		relationName: "friendships_receiverId_usersInAuth_id"
	}),
}));

export const tournamentsRelations = relations(tournaments, ({one, many}) => ({
	organization: one(organizations, {
		fields: [tournaments.organizationId],
		references: [organizations.id]
	}),
	sport: one(sports, {
		fields: [tournaments.sportId],
		references: [sports.id]
	}),
	matches: many(matches),
	tournamentEntrants: many(tournamentEntrants),
	tournamentPlayers: many(tournamentPlayers),
}));

export const organizationsRelations = relations(organizations, ({many}) => ({
	tournaments: many(tournaments),
	organizationMembers: many(organizationMembers),
}));

export const sportsRelations = relations(sports, ({many}) => ({
	tournaments: many(tournaments),
	handles: many(handles),
}));

export const matchesRelations = relations(matches, ({one}) => ({
	tournament: one(tournaments, {
		fields: [matches.tournamentId],
		references: [tournaments.id]
	}),
}));

export const userSettingsRelations = relations(userSettings, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [userSettings.userId],
		references: [usersInAuth.id]
	}),
}));

export const handlesRelations = relations(handles, ({one}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [handles.userId],
		references: [usersInAuth.id]
	}),
	sport: one(sports, {
		fields: [handles.sportId],
		references: [sports.id]
	}),
}));

export const tournamentEntrantsRelations = relations(tournamentEntrants, ({one, many}) => ({
	tournament: one(tournaments, {
		fields: [tournamentEntrants.tournamentId],
		references: [tournaments.id]
	}),
	entrantRosters: many(entrantRosters),
}));

export const entrantRostersRelations = relations(entrantRosters, ({one}) => ({
	tournamentEntrant: one(tournamentEntrants, {
		fields: [entrantRosters.entrantId],
		references: [tournamentEntrants.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [entrantRosters.userId],
		references: [usersInAuth.id]
	}),
}));

export const tournamentPlayersRelations = relations(tournamentPlayers, ({one}) => ({
	tournament: one(tournaments, {
		fields: [tournamentPlayers.tournamentId],
		references: [tournaments.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [tournamentPlayers.userId],
		references: [usersInAuth.id]
	}),
}));

export const organizationMembersRelations = relations(organizationMembers, ({one}) => ({
	organization: one(organizations, {
		fields: [organizationMembers.organizationId],
		references: [organizations.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [organizationMembers.userId],
		references: [usersInAuth.id]
	}),
}));