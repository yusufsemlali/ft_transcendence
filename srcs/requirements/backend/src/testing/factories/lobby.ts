import { faker } from '../faker';
import { lobby, competitors, rosters, invites } from '@/dal/db/schemas/lobby';

type LobbyInsert = typeof lobby.$inferInsert;
type CompetitorInsert = typeof competitors.$inferInsert;
type RosterInsert = typeof rosters.$inferInsert;
type InviteInsert = typeof invites.$inferInsert;

export function makeLobbyInsert(
    tournamentId: string,
    userId: string,
    overrides: Partial<LobbyInsert> = {},
): LobbyInsert {
    return {
        tournamentId,
        userId,
        status: 'solo',
        ...overrides,
    };
}

export function makeCompetitorInsert(
    tournamentId: string,
    overrides: Partial<CompetitorInsert> = {},
): CompetitorInsert {
    return {
        tournamentId,
        name: overrides.name ?? faker.internet.username().slice(0, 50),
        status: 'incomplete',
        seed: null,
        ...overrides,
    };
}

export function makeRosterInsert(
    competitorId: string,
    userId: string,
    overrides: Partial<RosterInsert> = {},
): RosterInsert {
    return {
        competitorId,
        userId,
        role: 'player',
        ...overrides,
    };
}

export function makeInviteInsert(
    tournamentId: string,
    competitorId: string,
    inviterId: string,
    targetUserId: string,
    overrides: Partial<InviteInsert> = {},
): InviteInsert {
    return {
        tournamentId,
        competitorId,
        inviterId,
        targetUserId,
        status: 'pending',
        ...overrides,
    };
}
