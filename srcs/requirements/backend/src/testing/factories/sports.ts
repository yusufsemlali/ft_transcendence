import { faker } from '../faker';
import { sports } from '@/dal/db/schemas/sports';

type SportInsert = typeof sports.$inferInsert;

const CATEGORIES = ['esports', 'physical', 'tabletop', 'custom'] as const;
const SCORING_TYPES = ['points_high', 'time_low', 'sets', 'binary', 'stocks'] as const;
const MODES = ['1v1', 'team', 'ffa'] as const;

const SPORT_PRESETS = [
    { name: 'Valorant', category: 'esports', scoringType: 'points_high', mode: 'team', handleType: 'riot_id', minTeam: 5, maxTeam: 5 },
    { name: 'League of Legends', category: 'esports', scoringType: 'points_high', mode: 'team', handleType: 'riot_id', minTeam: 5, maxTeam: 5 },
    { name: 'CS2', category: 'esports', scoringType: 'points_high', mode: 'team', handleType: 'steam_id', minTeam: 5, maxTeam: 5 },
    { name: 'Chess', category: 'tabletop', scoringType: 'binary', mode: '1v1', handleType: 'fide_id', minTeam: 1, maxTeam: 1 },
    { name: 'FIFA', category: 'esports', scoringType: 'points_high', mode: '1v1', handleType: 'psn_id', minTeam: 1, maxTeam: 1 },
    { name: 'Smash Bros', category: 'esports', scoringType: 'stocks', mode: '1v1', handleType: 'nintendo_id', minTeam: 1, maxTeam: 1 },
    { name: 'Basketball 3v3', category: 'physical', scoringType: 'points_high', mode: 'team', handleType: null, minTeam: 3, maxTeam: 5 },
    { name: 'Ping Pong', category: 'physical', scoringType: 'sets', mode: '1v1', handleType: null, minTeam: 1, maxTeam: 1 },
] as const;

export function makeSportInsert(overrides: Partial<SportInsert> = {}): SportInsert {
    const preset = faker.helpers.arrayElement(SPORT_PRESETS);
    const suffix = faker.string.alphanumeric(4);

    return {
        name: `${preset.name} ${suffix}`,
        category: preset.category as (typeof CATEGORIES)[number],
        scoringType: preset.scoringType as (typeof SCORING_TYPES)[number],
        mode: preset.mode as (typeof MODES)[number],
        requiredHandleType: preset.handleType,
        defaultMinTeamSize: preset.minTeam,
        defaultMaxTeamSize: preset.maxTeam,
        defaultHasDraws: false,
        tournamentConfigSchema: {},
        matchConfigSchema: {},
        ...overrides,
    };
}

export function makeSportPresets(): SportInsert[] {
    return SPORT_PRESETS.map((p) => ({
        name: p.name,
        category: p.category as (typeof CATEGORIES)[number],
        scoringType: p.scoringType as (typeof SCORING_TYPES)[number],
        mode: p.mode as (typeof MODES)[number],
        requiredHandleType: p.handleType,
        defaultMinTeamSize: p.minTeam,
        defaultMaxTeamSize: p.maxTeam,
        defaultHasDraws: false,
        tournamentConfigSchema: {},
        matchConfigSchema: {},
    }));
}
