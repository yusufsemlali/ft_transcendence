import {
    insertUsers,
    insertSportPresets,
    insertOrg,
    populateLobby,
    populateTeamLobby,
} from '@/testing/persistence';
import { db } from '@/dal/db';
import { tournaments } from '@/dal/db/schemas/tournaments';
import { sports } from '@/dal/db/schemas/sports';
import { makeTournamentInsert } from '@/testing/factories';
import { faker } from '@/testing/faker';

const SPORT_ALIASES: Record<string, string> = {
    val: 'Valorant',
    valorant: 'Valorant',
    lol: 'League of Legends',
    cs2: 'CS2',
    cs: 'CS2',
    d2: 'Dota 2',
    dota: 'Dota 2',
    dota2: 'Dota 2',
    ow2: 'Overwatch 2',
    ov2: 'Overwatch 2',
    overwatch: 'Overwatch 2',
    chess: 'Chess',
    fifa: 'FIFA',
    smash: 'Smash Bros',
    bball: 'Basketball 3v3',
    basketball: 'Basketball 3v3',
    soccer: 'Soccer',
    football: 'Soccer',
    tennis: 'Tennis',
    pp: 'Ping Pong',
    pingpong: 'Ping Pong',
};

function parseArgs() {
    const raw = process.argv.slice(2).filter((a: string) => a !== '--');
    const flags: Record<string, string> = {};

    for (let i = 0; i < raw.length; i++) {
        const arg = raw[i];
        if (arg.includes('=')) {
            const [key, ...rest] = arg.split('=');
            if (key) flags[key.replace(/^--/, '').toLowerCase()] = rest.join('=');
        } else if (arg.startsWith('--')) {
            const key = arg.replace(/^--/, '').toLowerCase();
            const val = raw[i + 1];
            if (val && !val.startsWith('--')) {
                flags[key] = val;
                i++;
            }
        }
    }

    return {
        userCount: Number(flags['users'] || 32),
        tournamentCount: Number(flags['tournaments'] || 1),
        teamCount: Number(flags['teams'] || 0),
        sportAlias: (flags['sport'] || '').toLowerCase(),
    };
}

function printAvailableSports() {
    const byName = new Map<string, string[]>();
    for (const [alias, name] of Object.entries(SPORT_ALIASES)) {
        const list = byName.get(name) ?? [];
        list.push(alias);
        byName.set(name, list);
    }
    console.log('  Available sports:');
    for (const [name, aliases] of byName) {
        console.log(`    ${aliases.join(', ').padEnd(30)} -> ${name}`);
    }
}

async function main() {
    const { userCount, tournamentCount, teamCount, sportAlias } = parseArgs();

    console.log('Inserting sport presets...');
    await insertSportPresets();
    const allSports = await db.select().from(sports);
    if (allSports.length === 0) {
        console.error('No sports in database. Aborting.');
        process.exit(1);
    }

    let sport: typeof allSports[number];
    if (sportAlias) {
        const sportName = SPORT_ALIASES[sportAlias];
        if (!sportName) {
            console.error(`\n  Unknown sport alias: "${sportAlias}"\n`);
            printAvailableSports();
            process.exit(1);
        }
        const found = allSports.find((s: typeof allSports[number]) => s.name === sportName);
        if (!found) {
            console.error(`Sport "${sportName}" not found in DB (preset may have failed to insert).`);
            process.exit(1);
        }
        sport = found;
    } else {
        sport = allSports[0];
    }

    const mode = sport.mode;
    const isTeamMode = mode === 'team';
    const minTeamSize = sport.defaultMinTeamSize ?? (isTeamMode ? 5 : 1);
    const maxTeamSize = sport.defaultMaxTeamSize ?? minTeamSize;

    const effectiveTeams = isTeamMode ? (teamCount || Math.floor(userCount / maxTeamSize)) : 0;
    const playersPerTeam = maxTeamSize;
    const rosteredCount = effectiveTeams * playersPerTeam;
    const soloCount = userCount - rosteredCount;

    if (isTeamMode && rosteredCount > userCount) {
        console.error(
            `\n  Not enough users: ${effectiveTeams} teams x ${playersPerTeam} players = ${rosteredCount}, ` +
            `but only ${userCount} users.\n  Either increase --users or decrease --teams.\n`,
        );
        process.exit(1);
    }

    console.log('\n=== Lobby Test Seed ===');
    console.log(`  Sport:       ${sport.name} (${mode}, ${minTeamSize}-${maxTeamSize} per team)`);
    console.log(`  Users:       ${userCount}`);
    console.log(`  Tournaments: ${tournamentCount}`);
    if (isTeamMode) {
        console.log(`  Teams:       ${effectiveTeams} x ${playersPerTeam} players`);
        if (soloCount > 0) {
            console.log(`  Solo:        ${soloCount} user(s) will stay unrostered in lobby`);
        }
    } else {
        console.log(`  Mode:        1v1 (each user = one competitor)`);
    }
    console.log();

    console.log(`Creating ${userCount} + 1 fake users (password: Test1234!)...`);
    const allUsers = await insertUsers(userCount + 1);
    const [owner, ...userRows] = allUsers;
    console.log(`  ${allUsers.length} users created (1 TO + ${userRows.length} participants)\n`);

    console.log('Creating organization...');
    const org = await insertOrg(owner.id);
    console.log(`  "${org.name}" id=${org.id} (owner: ${owner.username})\n`);

    console.log(`Creating ${tournamentCount} tournament(s)...`);
    const tournamentRows: (typeof tournaments.$inferSelect)[] = [];

    for (let i = 0; i < tournamentCount; i++) {
        const data = makeTournamentInsert(org.id, sport.id, {
            mode,
            minTeamSize,
            maxTeamSize,
            lobbyCapacity: Math.max(userCount * 2, 128),
            minParticipants: 2,
            status: 'registration',
            scoringType: sport.scoringType,
            matchConfigSchema: sport.matchConfigSchema ?? {},
        });
        const [row] = await db.insert(tournaments).values(data).returning();
        tournamentRows.push(row);
        console.log(`  [${i + 1}] "${row.name}" (${mode}, ${minTeamSize}-${maxTeamSize}) — capacity ${data.lobbyCapacity}`);
    }
    console.log();

    console.log('Populating lobbies...');
    const lobbyUserIds = userRows.map((u: any) => u.id);

    for (const t of tournamentRows) {
        if (isTeamMode && effectiveTeams > 0) {
            const teams: { name: string; userIds: string[] }[] = [];
            for (let ti = 0; ti < effectiveTeams; ti++) {
                const start = ti * playersPerTeam;
                const end = start + playersPerTeam;
                teams.push({
                    name: faker.company.name().slice(0, 50),
                    userIds: lobbyUserIds.slice(start, end),
                });
            }

            const soloIds = lobbyUserIds.slice(rosteredCount);
            const graph = await populateTeamLobby(t.id, teams, soloIds);
            console.log(
                `  "${t.name}": ${graph.lobbyRows.length} in lobby, ` +
                `${graph.competitorRows.length} teams, ${graph.rosterRows.length} roster slots`,
            );
        } else {
            const graph = await populateLobby(t.id, lobbyUserIds, '1v1');
            console.log(`  "${t.name}": ${graph.lobbyRows.length} players, ${graph.competitorRows.length} competitors`);
        }
    }

    console.log('\n=== Seed Complete ===');
    console.log(`  TO (owner):    ${owner.username} (${owner.email})`);
    console.log(`  Password:      Test1234!`);
    console.log(`  Organization:  ${org.name} (${org.id})`);
    console.log(`  Sport:         ${sport.name}`);
    console.log(`  Tournaments:   ${tournamentRows.length}`);
    for (const t of tournamentRows) {
        console.log(`    -> ${t.name} (${t.id})`);
    }
    console.log(`  Participants:  ${userRows.length}`);
    if (isTeamMode && effectiveTeams > 0) {
        console.log(`  Teams:         ${effectiveTeams} x ${playersPerTeam} players = ${rosteredCount} rostered`);
        if (soloCount > 0) {
            console.log(`  Solo users:    ${soloCount}`);
        }
    }
    console.log();

    process.exit(0);
}

main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
