import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'moderator', 'organizer']);
export const tournamentStatusEnum = pgEnum('tournament_status', ['draft', 'registration', 'upcoming', 'ongoing', 'completed', 'cancelled']);
export const bracketTypeEnum = pgEnum('bracket_type', ['single_elimination', 'double_elimination', 'round_robin', 'swiss']);
export const matchStatusEnum = pgEnum('match_status', ['pending', 'ongoing', 'completed', 'disputed', 'cancelled']);
export const friendshipStatusEnum = pgEnum('friendship_status', ['pending', 'accepted', 'blocked']);
export const notificationTypeEnum = pgEnum('notification_type', ['friend_request', 'tournament_invite', 'match_starting', 'achievement_unlocked', 'system_alert']);
export const supportedGameEnum = pgEnum('supported_game', ['league_of_legends', 'cs2', 'valorant', 'dota2', 'overwatch2']);
