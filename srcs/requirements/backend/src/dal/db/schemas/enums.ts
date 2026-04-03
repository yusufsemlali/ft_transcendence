import { pgEnum } from 'drizzle-orm/pg-core';
import { ORG_ROLES } from '@ft-transcendence/contracts';

// --- User & Social ---
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'moderator', 'organizer']);
export const userStatusEnum = pgEnum('user_status', ['active', 'suspended', 'banned', 'muted']);
export const friendshipStatusEnum = pgEnum('friendship_status', ['pending', 'accepted', 'blocked']);
export const notificationTypeEnum = pgEnum('notification_type', ['friend_request', 'tournament_invite', 'match_starting', 'achievement_unlocked', 'system_alert']);

// --- Organization ---
export const orgRoleEnum = pgEnum('org_role', ORG_ROLES as [string, ...string[]]);

// --- Tournament Lifecycle ---
export const tournamentStatusEnum = pgEnum('tournament_status', ['draft', 'registration', 'upcoming', 'ongoing', 'completed', 'cancelled']);

// --- Modes (Blueprint Archetypes) ---
export const sportModeEnum = pgEnum('sport_mode', ['1v1', 'team', 'ffa']);
export const sportCategoryEnum = pgEnum('sport_category', ['esports', 'physical', 'tabletop']);

// --- Bracket Structure ---
export const bracketTypeEnum = pgEnum('bracket_type', [
    'single_elimination',
    'double_elimination',
    'round_robin',
    'swiss',
    'free_for_all', 
]);

// --- Scoring ---
export const scoringTypeEnum = pgEnum('scoring_type', [
    'points_high', 
    'time_low',    
    'sets',        
    'binary',      
    'stocks',      
]);

// --- Match ---
export const matchStatusEnum = pgEnum('match_status', ['pending', 'ongoing', 'completed', 'disputed', 'cancelled']);
