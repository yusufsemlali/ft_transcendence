/**
 * The Mode determines the primary relationship between participants. (1v1, team, or FFA)
 */
export const SPORT_MODES = ['1v1', 'team'] as const;
export type SportMode = (typeof SPORT_MODES)[number];

export const SPORT_CATEGORIES = ['esports', 'physical', 'tabletop', 'custom'] as const;
export type SportCategory = (typeof SPORT_CATEGORIES)[number];

/**
 * The Scoring Type tells the engine how to sort the leaderboard.
 * Points High: Basketball, Soccer, LoL
 * Time Low: Racing, Speedrunning
 * Sets: Tennis, Volleyball
 * Stocks: Smash Bros.
 */
export const SCORING_TYPES = [
    'points_high', 
    'time_low',     
    'sets',         
    'binary',       
    'stocks',       
] as const;
export type ScoringType = (typeof SCORING_TYPES)[number];

/**
 * Standardized Handle Types for Identity Verification.
 */
export const HANDLE_TYPES = [
    'riot_id',
    'steam_id',
    'psn_id',
    'xbox_id',
    'battlenet_id',
    'nintendo_id',
    'uplay_id',
    'epic_id',
    'fide_id',     
    'other',
    'generic_id',
] as const;
export type HandleType = (typeof HANDLE_TYPES)[number];
