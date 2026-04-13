import { faker } from '../faker';
import { tournaments } from '@/dal/db/schemas/tournaments';

type TournamentInsert = typeof tournaments.$inferInsert;

const BRACKET_TYPES = ['single_elimination', 'round_robin'] as const;
const STATUSES = ['draft', 'registration', 'upcoming', 'ongoing', 'completed', 'cancelled'] as const;
const MODES = ['1v1', 'team'] as const;
const SCORING_TYPES = ['points_high', 'time_low', 'sets', 'binary', 'stocks'] as const;

export function makeTournamentInsert(
    organizationId: string,
    sportId: string,
    overrides: Partial<TournamentInsert> = {},
): TournamentInsert {
    const adjective = faker.helpers.arrayElement([
        'Winter', 'Summer', 'Global', 'Elite', 'Pro', 'Charity', 'Weekly',
        'Midnight', 'Grand', 'Rising', 'Legendary',
    ]);
    const noun = faker.helpers.arrayElement([
        'Championship', 'Classic', 'Showdown', 'Cup', 'League',
        'Invitational', 'Brawl', 'Series', 'Clash', 'Arena',
    ]);
    const name = `${adjective} ${noun} ${faker.string.alphanumeric(4)}`;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-${faker.string.alphanumeric(6)}`;

    const mode = overrides.mode ?? '1v1';
    const is1v1 = mode === '1v1';

    return {
        organizationId,
        sportId,
        name,
        slug,
        description: faker.lorem.sentence(),
        scoringType: faker.helpers.arrayElement([...SCORING_TYPES]),
        matchConfigSchema: {},
        mode,
        minTeamSize: is1v1 ? 1 : faker.number.int({ min: 2, max: 5 }),
        maxTeamSize: is1v1 ? 1 : faker.number.int({ min: 5, max: 10 }),
        allowDraws: faker.datatype.boolean(),
        requiredHandleType: is1v1 ? 'riot_id' : null,
        minParticipants: 2,
        lobbyCapacity: faker.helpers.arrayElement([8, 16, 32, 64, 128]),
        status: 'draft',
        bracketType: faker.helpers.arrayElement([...BRACKET_TYPES]),
        isPrivate: faker.datatype.boolean({ probability: 0.1 }),
        customSettings: {},
        ...overrides,
    };
}

export function makeTournamentInserts(
    count: number,
    organizationId: string,
    sportId: string,
    overrides: Partial<TournamentInsert> = {},
): TournamentInsert[] {
    return Array.from({ length: count }, () =>
        makeTournamentInsert(organizationId, sportId, overrides),
    );
}
