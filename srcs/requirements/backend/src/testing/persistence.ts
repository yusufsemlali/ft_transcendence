import { db } from '@/dal/db';
import { users } from '@/dal/db/schemas/users';
import { organizations, organizationMembers } from '@/dal/db/schemas/organizations';
import { sports } from '@/dal/db/schemas/sports';
import { tournaments } from '@/dal/db/schemas/tournaments';
import { lobby, competitors, rosters, invites } from '@/dal/db/schemas/lobby';
import { hashPassword } from '@/utils/password';
import {
    makeUserInserts,
    makeOrgInsert,
    makeOrgMemberInsert,
    makeSportPresets,
    makeTournamentInserts,
    makeTournamentInsert,
    makeLobbyInsert,
    makeCompetitorInsert,
    makeRosterInsert,
} from './factories';

const CHUNK_SIZE = 500;

function isDuplicateKeyError(e: unknown): boolean {
    if (typeof e !== 'object' || e === null) return false;
    const err = e as any;
    return err.code === '23505'
        || err.cause?.code === '23505'
        || err.constraint?.includes('unique')
        || err.cause?.constraint?.includes('unique');
}

async function insertChunked(
    table: any,
    rows: Record<string, unknown>[],
): Promise<any[]> {
    const results: any[] = [];
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        const inserted = await db.insert(table).values(chunk as any).returning();
        results.push(...(inserted as any[]));
    }
    return results;
}

export async function insertUsers(count: number, password = 'Test1234!') {
    const hashed = await hashPassword(password);
    const data = makeUserInserts(count, { password: hashed });
    return insertChunked(users, data);
}

export async function insertSportPresets() {
    const data = makeSportPresets();
    const results: any[] = [];
    for (const sport of data) {
        try {
            const [inserted] = await db.insert(sports).values(sport).returning();
            results.push(inserted);
        } catch (e: unknown) {
            if (isDuplicateKeyError(e)) {
                console.log(`  Sport "${sport.name}" already exists, skipping.`);
                continue;
            }
            throw e;
        }
    }
    if (results.length === 0) {
        const existing = await db.select().from(sports).limit(1);
        if (existing.length > 0) results.push(existing[0]);
    }
    return results;
}

export async function insertOrg(ownerId: string, overrides: Partial<typeof organizations.$inferInsert> = {}) {
    const data = makeOrgInsert(overrides);
    const [org] = await db.insert(organizations).values(data).returning();
    await db.insert(organizationMembers).values(
        makeOrgMemberInsert(org.id, ownerId, { role: 'owner' }),
    );
    return org;
}

export async function insertTournaments(
    count: number,
    organizationId: string,
    sportId: string,
    overrides: Partial<typeof tournaments.$inferInsert> = {},
) {
    const data = makeTournamentInserts(count, organizationId, sportId, overrides);
    return insertChunked(tournaments, data);
}

type SportRow = typeof sports.$inferSelect;

/** One tournament per index, rotating through `sportList`; mode / team sizes follow each sport blueprint. */
export async function insertTournamentsFromSports(
    count: number,
    organizationId: string,
    sportList: SportRow[],
) {
    if (sportList.length === 0) {
        throw new Error('insertTournamentsFromSports: sportList is empty');
    }
    const rows: (typeof tournaments.$inferInsert)[] = [];
    for (let i = 0; i < count; i++) {
        const sp = sportList[i % sportList.length];
        const mode = sp.mode;
        let minTeam = sp.defaultMinTeamSize;
        let maxTeam = sp.defaultMaxTeamSize;
        if (mode === '1v1') {
            minTeam = minTeam ?? 1;
            maxTeam = maxTeam ?? 1;
        } else if (mode === 'team') {
            minTeam = minTeam ?? 5;
            maxTeam = maxTeam ?? 5;
        } else {
            minTeam = minTeam ?? 1;
            maxTeam = maxTeam ?? 8;
        }
        if (maxTeam < minTeam) maxTeam = minTeam;

        rows.push(
            makeTournamentInsert(organizationId, sp.id, {
                mode,
                minTeamSize: minTeam,
                maxTeamSize: maxTeam,
                scoringType: sp.scoringType,
                requiredHandleType: sp.requiredHandleType,
                matchConfigSchema: sp.matchConfigSchema ?? {},
            }),
        );
    }
    return insertChunked(tournaments, rows);
}

export interface LobbyGraph {
    tournamentId: string;
    lobbyRows: any[];
    competitorRows: any[];
    rosterRows: any[];
}

export async function populateLobby(
    tournamentId: string,
    userIds: string[],
    mode: '1v1' | 'team' | 'ffa' = '1v1',
): Promise<LobbyGraph> {
    const lobbyRows: any[] = [];
    const competitorRows: any[] = [];
    const rosterRows: any[] = [];

    const is1v1 = mode === '1v1';

    for (const userId of userIds) {
        const lobbyData = makeLobbyInsert(tournamentId, userId, {
            status: is1v1 ? 'rostered' : 'solo',
        });
        const [lobbyRow] = await db.insert(lobby).values(lobbyData).returning();
        lobbyRows.push(lobbyRow);

        if (is1v1) {
            const compData = makeCompetitorInsert(tournamentId, {
                name: `Player-${userId.slice(0, 8)}`,
                status: 'ready',
            });
            const [comp] = await db.insert(competitors).values(compData).returning();
            competitorRows.push(comp);

            const rosterData = makeRosterInsert(comp.id, userId, { role: 'captain' });
            const [roster] = await db.insert(rosters).values(rosterData).returning();
            rosterRows.push(roster);
        }
    }

    return { tournamentId, lobbyRows, competitorRows, rosterRows };
}

export async function populateTeamLobby(
    tournamentId: string,
    teams: { name: string; userIds: string[] }[],
    soloUserIds: string[] = [],
): Promise<LobbyGraph> {
    const lobbyRows: any[] = [];
    const competitorRows: any[] = [];
    const rosterRows: any[] = [];

    const allUserIds = teams.flatMap((t) => t.userIds);
    for (const userId of allUserIds) {
        const lobbyData = makeLobbyInsert(tournamentId, userId, { status: 'rostered' });
        const [lobbyRow] = await db.insert(lobby).values(lobbyData).returning();
        lobbyRows.push(lobbyRow);
    }

    for (const userId of soloUserIds) {
        const lobbyData = makeLobbyInsert(tournamentId, userId, { status: 'solo' });
        const [lobbyRow] = await db.insert(lobby).values(lobbyData).returning();
        lobbyRows.push(lobbyRow);
    }

    for (const team of teams) {
        const compData = makeCompetitorInsert(tournamentId, {
            name: team.name,
            status: 'ready',
        });
        const [comp] = await db.insert(competitors).values(compData).returning();
        competitorRows.push(comp);

        for (let i = 0; i < team.userIds.length; i++) {
            const role = i === 0 ? 'captain' : 'player';
            const rosterData = makeRosterInsert(comp.id, team.userIds[i], { role: role as any });
            const [roster] = await db.insert(rosters).values(rosterData).returning();
            rosterRows.push(roster);
        }
    }

    return { tournamentId, lobbyRows, competitorRows, rosterRows };
}
