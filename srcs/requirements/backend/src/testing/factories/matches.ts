import { faker } from '../faker';
import { matches } from '@/dal/db/schemas/matches';

type MatchInsert = typeof matches.$inferInsert;

export function makeMatchInsert(
    tournamentId: string,
    round: number,
    position: number,
    overrides: Partial<MatchInsert> = {},
): MatchInsert {
    return {
        tournamentId,
        participant1Id: null,
        participant2Id: null,
        score1: 0,
        score2: 0,
        winnerId: null,
        status: 'pending',
        round,
        position,
        nextMatchId: null,
        matchStats: {},
        matchConfigSchema: {},
        scheduledAt: null,
        completedAt: null,
        ...overrides,
    };
}

export function makeBracketMatches(
    tournamentId: string,
    competitorIds: string[],
): MatchInsert[] {
    const n = competitorIds.length;
    const rounds = Math.ceil(Math.log2(n));
    const results: MatchInsert[] = [];

    let position = 0;
    for (let round = 1; round <= rounds; round++) {
        const matchesInRound = Math.ceil(n / Math.pow(2, round));
        for (let m = 0; m < matchesInRound; m++) {
            const isFirstRound = round === 1;
            results.push(makeMatchInsert(tournamentId, round, position++, {
                participant1Id: isFirstRound ? competitorIds[m * 2] ?? null : null,
                participant2Id: isFirstRound ? competitorIds[m * 2 + 1] ?? null : null,
            }));
        }
    }
    return results;
}
