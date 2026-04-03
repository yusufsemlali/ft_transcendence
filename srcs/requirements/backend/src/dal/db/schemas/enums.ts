import { pgEnum } from 'drizzle-orm/pg-core';

// --- User & Social ---
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'moderator', 'organizer']);
export const friendshipStatusEnum = pgEnum('friendship_status', ['pending', 'accepted', 'blocked']);
export const notificationTypeEnum = pgEnum('notification_type', ['friend_request', 'tournament_invite', 'match_starting', 'achievement_unlocked', 'system_alert']);

// --- Tournament Lifecycle ---
export const tournamentStatusEnum = pgEnum('tournament_status', ['draft', 'registration', 'upcoming', 'ongoing', 'completed', 'cancelled']);

// --- Bracket Structure ---
// How is the bracket structured?
export const bracketTypeEnum = pgEnum('bracket_type', [
    'single_elimination',
    'double_elimination',
    'round_robin',
    'swiss',
    'free_for_all', // Swimming, Running Tracks, Battle Royales
]);

// --- Scoring ---
// How do we determine a winner in a match?
export const scoringTypeEnum = pgEnum('scoring_type', [
    'points_high', // Basketball, FIFA (More points = win)
    'time_low',    // Swimming, Running (Lower time = win)
    'sets',        // Tennis, Volleyball (Win X sets)
    'binary',      // Pool, Chess (Just Win/Loss/Draw)
]);

// --- Match ---
export const matchStatusEnum = pgEnum('match_status', ['pending', 'ongoing', 'completed', 'disputed', 'cancelled']);
