import {
    insertUsers,
    insertSportPresets,
    insertOrg,
    insertTournamentsFromSports,
    populateLobby,
} from '@/testing/persistence';
import { db } from '@/dal/db';
import { tournaments } from '@/dal/db/schemas/tournaments';
import { sports } from '@/dal/db/schemas/sports';
import { eq } from 'drizzle-orm';

function parseArgs() {
    const raw = process.argv.slice(2).filter((a) => a !== '--');
    const flags: Record<string, string> = {};
    for (let i = 0; i < raw.length; i += 2) {
        const key = raw[i]?.replace(/^--/, '');
        const val = raw[i + 1];
        if (key && val) flags[key] = val;
    }
    return {
        userCount: Number(flags['users'] || 50),
        tournamentCount: Number(flags['tournaments'] || 10),
        lobbySize: Number(flags['lobby'] || 8),
    };
}

async function main() {
    const { userCount, tournamentCount, lobbySize } = parseArgs();
    console.log(`\nSeed config: ${userCount} users, ${tournamentCount} tournaments, ${lobbySize} players/lobby\n`);

    console.log('Inserting sport presets (skips existing names)...');
    await insertSportPresets();
    const allSports = await db.select().from(sports);
    if (allSports.length === 0) {
        console.error('No sports in database. Aborting.');
        process.exit(1);
    }
    console.log(`  ${allSports.length} sports in DB (rotating across tournaments)\n`);

    console.log(`Inserting ${userCount} fake users (password: Test1234!)...`);
    const userRows = await insertUsers(userCount);
    console.log(`  ${userRows.length} users created\n`);

    const ownerId = userRows[0].id;
    console.log('Creating organization (owner = first seeded user)...');
    const org = await insertOrg(ownerId);
    console.log(`  "${org.name}" id=${org.id}\n`);

    console.log(`Inserting ${tournamentCount} tournaments (mixed modes from each sport blueprint)...`);
    const tournamentRows = await insertTournamentsFromSports(tournamentCount, org.id, allSports);
    const byMode = tournamentRows.reduce(
        (acc, t) => {
            acc[t.mode] = (acc[t.mode] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>,
    );
    console.log(`  ${tournamentRows.length} tournaments created: ${JSON.stringify(byMode)}\n`);

    const lobbyTournaments = tournamentRows.filter((t) => t.mode === '1v1').slice(0, 5);
    console.log(`Populating lobbies for ${lobbyTournaments.length} 1v1 tournaments only (${lobbySize} players each)...`);

    for (const t of lobbyTournaments) {
        await db
            .update(tournaments)
            .set({ status: 'registration' })
            .where(eq(tournaments.id, t.id));

        const lobbyUserIds = userRows.slice(1, 1 + lobbySize).map((u: any) => u.id);

        const graph = await populateLobby(t.id, lobbyUserIds, '1v1');
        console.log(`  ${t.name}: ${graph.lobbyRows.length} players, ${graph.competitorRows.length} competitors`);
    }

    console.log('\nSeeding complete!\n');
    console.log('Quick reference:');
    console.log(`  Owner user:    ${userRows[0].username} (${userRows[0].email})`);
    console.log(`  Password:      Test1234!`);
    console.log(`  Organization:  ${org.name} (${org.id})`);
    console.log(`  Sports used:   ${allSports.map((s) => s.name).join(', ')}`);
    console.log(`  Tournaments:   ${tournamentRows.length} total, ${lobbyTournaments.length} with 1v1 lobbies`);
    console.log(`  Total users:   ${userRows.length}\n`);

    process.exit(0);
}

main().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
