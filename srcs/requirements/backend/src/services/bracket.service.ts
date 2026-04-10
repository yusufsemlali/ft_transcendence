import { db } from "@/dal/db";
import { matches } from "@/dal/db/schemas/matches";
import { competitors } from "@/dal/db/schemas/lobby";
import { tournaments } from "@/dal/db/schemas/tournaments";
import { eq, and, count } from "drizzle-orm";
import AppError from "@/utils/error";
import type { BracketType } from "@ft-transcendence/contracts";

interface Competitor {
    id: string;
    name: string;
    seed: number | null;
    status: string;
}

interface MatchInsert {
    tournamentId: string;
    round: number;
    position: number;
    participant1Id: string | null;
    participant2Id: string | null;
    nextMatchId: string | null;
    status: "pending" | "ongoing" | "completed" | "disputed" | "cancelled";
    matchStats: Record<string, unknown>;
    matchConfigSchema: Record<string, unknown>;
}

// ─── Helpers ─────────────────────────────────────────────

function seedOrder(n: number): number[] {
    if (n === 1) return [0];
    const half = seedOrder(n / 2);
    return half.flatMap((i) => [i, n - 1 - i]);
}

function nextPowerOf2(n: number): number {
    let p = 1;
    while (p < n) p *= 2;
    return p;
}

async function getReadyCompetitors(tournamentId: string): Promise<Competitor[]> {
    const rows = await db
        .select()
        .from(competitors)
        .where(
            and(
                eq(competitors.tournamentId, tournamentId),
                eq(competitors.status, "ready"),
            ),
        );

    return rows
        .map((r) => ({
            id: r.id,
            name: r.name,
            seed: r.seed,
            status: r.status,
        }))
        .sort((a, b) => (a.seed ?? Infinity) - (b.seed ?? Infinity));
}

async function assertNoExistingMatches(tournamentId: string) {
    const [row] = await db
        .select({ n: count() })
        .from(matches)
        .where(eq(matches.tournamentId, tournamentId));
    if (Number(row?.n ?? 0) > 0) {
        throw new AppError(409, "Bracket already generated. Reset it first.");
    }
}

function getRoundLabel(round: number, totalRounds: number, bracketType: string): string {
    if (bracketType === "round_robin") return `Round ${round}`;
    if (bracketType === "free_for_all") return `Round ${round}`;

    const remaining = totalRounds - round;
    if (remaining === 0) return "Finals";
    if (remaining === 1) return "Semifinals";
    if (remaining === 2) return "Quarterfinals";
    const size = Math.pow(2, remaining + 1);
    return `Round of ${size}`;
}

// ─── Single Elimination ──────────────────────────────────

async function generateSingleElimination(tournamentId: string, comps: Competitor[]): Promise<void> {
    const n = comps.length;
    const slots = nextPowerOf2(n);
    const totalRounds = Math.log2(slots);
    const order = seedOrder(slots);

    const seeded: (Competitor | null)[] = new Array(slots).fill(null);
    for (let i = 0; i < n; i++) {
        seeded[order[i]] = comps[i];
    }

    const allMatches: (MatchInsert & { tempId: string })[] = [];
    const matchGrid: string[][] = [];

    for (let round = 1; round <= totalRounds; round++) {
        const matchesInRound = slots / Math.pow(2, round);
        const roundMatches: string[] = [];
        for (let pos = 0; pos < matchesInRound; pos++) {
            const tempId = `r${round}p${pos}`;
            roundMatches.push(tempId);
            allMatches.push({
                tempId,
                tournamentId,
                round,
                position: pos,
                participant1Id: null,
                participant2Id: null,
                nextMatchId: null,
                status: "pending",
                matchStats: {},
                matchConfigSchema: {},
            });
        }
        matchGrid.push(roundMatches);
    }

    // Wire first round participants
    for (let pos = 0; pos < slots / 2; pos++) {
        const m = allMatches.find((m) => m.tempId === `r1p${pos}`)!;
        const p1 = seeded[pos * 2];
        const p2 = seeded[pos * 2 + 1];
        m.participant1Id = p1?.id ?? null;
        m.participant2Id = p2?.id ?? null;

        // Auto-advance byes
        if (p1 && !p2) {
            m.status = "completed";
        } else if (!p1 && p2) {
            m.status = "completed";
        }
    }

    // Wire nextMatchId links
    for (let round = 0; round < matchGrid.length - 1; round++) {
        const currentRound = matchGrid[round];
        const nextRound = matchGrid[round + 1];
        for (let i = 0; i < currentRound.length; i++) {
            const nextPos = Math.floor(i / 2);
            const m = allMatches.find((m) => m.tempId === currentRound[i])!;
            m.nextMatchId = nextRound[nextPos];
        }
    }

    // Insert matches, resolving temp IDs to real UUIDs
    const tempToReal = new Map<string, string>();
    const crypto = await import("crypto");
    for (const m of allMatches) {
        tempToReal.set(m.tempId, crypto.randomUUID());
    }

    const inserts = allMatches.map((m) => ({
        id: tempToReal.get(m.tempId)!,
        tournamentId: m.tournamentId,
        round: m.round,
        position: m.position,
        participant1Id: m.participant1Id,
        participant2Id: m.participant2Id,
        nextMatchId: m.nextMatchId ? (tempToReal.get(m.nextMatchId) ?? null) : null,
        status: m.status,
        matchStats: m.matchStats,
        matchConfigSchema: m.matchConfigSchema,
    }));

    if (inserts.length > 0) {
        await db.insert(matches).values(inserts as any);
    }

    // Auto-advance byes: propagate winners through
    await propagateByes(tournamentId);
}

// ─── Double Elimination ──────────────────────────────────

async function generateDoubleElimination(tournamentId: string, comps: Competitor[]): Promise<void> {
    const n = comps.length;
    const slots = nextPowerOf2(n);
    const winnersRounds = Math.log2(slots);
    const losersRounds = (winnersRounds - 1) * 2;

    const order = seedOrder(slots);
    const seeded: (Competitor | null)[] = new Array(slots).fill(null);
    for (let i = 0; i < n; i++) {
        seeded[order[i]] = comps[i];
    }

    const crypto = await import("crypto");
    const allInserts: Array<{
        id: string;
        tournamentId: string;
        round: number;
        position: number;
        participant1Id: string | null;
        participant2Id: string | null;
        nextMatchId: string | null;
        status: "pending" | "completed";
        matchStats: Record<string, unknown>;
        matchConfigSchema: Record<string, unknown>;
    }> = [];

    // Round encoding: winners bracket = 1..winnersRounds,
    // losers bracket = 100+round (101..100+losersRounds),
    // grand finals = 200
    const winnersGrid: string[][] = [];
    const losersGrid: string[][] = [];

    // Generate winners bracket matches
    for (let round = 1; round <= winnersRounds; round++) {
        const matchesInRound = slots / Math.pow(2, round);
        const roundIds: string[] = [];
        for (let pos = 0; pos < matchesInRound; pos++) {
            const id = crypto.randomUUID();
            roundIds.push(id);
            allInserts.push({
                id,
                tournamentId,
                round,
                position: pos,
                participant1Id: null,
                participant2Id: null,
                nextMatchId: null,
                status: "pending",
                matchStats: {},
                matchConfigSchema: {},
            });
        }
        winnersGrid.push(roundIds);
    }

    // Generate losers bracket matches
    for (let lr = 1; lr <= losersRounds; lr++) {
        const prevLosers = lr === 1 ? slots / 2 : losersGrid[lr - 2].length;
        const matchesInRound = lr % 2 === 1 ? Math.ceil(prevLosers / 2) : prevLosers / 2 || 1;
        const actualMatches = Math.max(1, Math.floor(matchesInRound));
        const roundIds: string[] = [];
        for (let pos = 0; pos < actualMatches; pos++) {
            const id = crypto.randomUUID();
            roundIds.push(id);
            allInserts.push({
                id,
                tournamentId,
                round: 100 + lr,
                position: pos,
                participant1Id: null,
                participant2Id: null,
                nextMatchId: null,
                status: "pending",
                matchStats: {},
                matchConfigSchema: {},
            });
        }
        losersGrid.push(roundIds);
    }

    // Grand finals
    const gfId = crypto.randomUUID();
    allInserts.push({
        id: gfId,
        tournamentId,
        round: 200,
        position: 0,
        participant1Id: null,
        participant2Id: null,
        nextMatchId: null,
        status: "pending",
        matchStats: {},
        matchConfigSchema: {},
    });

    // Wire winners bracket nextMatchId
    for (let i = 0; i < winnersGrid.length - 1; i++) {
        for (let j = 0; j < winnersGrid[i].length; j++) {
            const nextPos = Math.floor(j / 2);
            const ins = allInserts.find((m) => m.id === winnersGrid[i][j])!;
            ins.nextMatchId = winnersGrid[i + 1][nextPos];
        }
    }
    // Winners finals → grand finals
    if (winnersGrid.length > 0) {
        const wfInsert = allInserts.find((m) => m.id === winnersGrid[winnersGrid.length - 1][0]);
        if (wfInsert) wfInsert.nextMatchId = gfId;
    }

    // Wire losers bracket nextMatchId
    for (let i = 0; i < losersGrid.length - 1; i++) {
        for (let j = 0; j < losersGrid[i].length; j++) {
            const nextPos = Math.min(j, (losersGrid[i + 1]?.length ?? 1) - 1);
            const ins = allInserts.find((m) => m.id === losersGrid[i][j])!;
            ins.nextMatchId = losersGrid[i + 1]?.[nextPos] ?? null;
        }
    }
    // Losers finals → grand finals
    if (losersGrid.length > 0) {
        const lfInsert = allInserts.find((m) => m.id === losersGrid[losersGrid.length - 1][0]);
        if (lfInsert) lfInsert.nextMatchId = gfId;
    }

    // Seed first round of winners
    for (let pos = 0; pos < slots / 2; pos++) {
        const ins = allInserts.find((m) => m.id === winnersGrid[0][pos])!;
        const p1 = seeded[pos * 2];
        const p2 = seeded[pos * 2 + 1];
        ins.participant1Id = p1?.id ?? null;
        ins.participant2Id = p2?.id ?? null;
        if ((p1 && !p2) || (!p1 && p2)) {
            ins.status = "completed";
        }
    }

    if (allInserts.length > 0) {
        await db.insert(matches).values(allInserts as any);
    }

    await propagateByes(tournamentId);
}

// ─── Round Robin ─────────────────────────────────────────

async function generateRoundRobin(tournamentId: string, comps: Competitor[]): Promise<void> {
    const participants = [...comps];
    const hasOdd = participants.length % 2 !== 0;

    // Circle method: add a BYE placeholder if odd
    const list: (Competitor | null)[] = hasOdd ? [...participants, null] : [...participants];
    const n = list.length;
    const totalRounds = n - 1;

    const crypto = await import("crypto");
    const allInserts: Array<{
        id: string;
        tournamentId: string;
        round: number;
        position: number;
        participant1Id: string | null;
        participant2Id: string | null;
        nextMatchId: null;
        status: "pending" | "completed";
        matchStats: Record<string, unknown>;
        matchConfigSchema: Record<string, unknown>;
    }> = [];

    for (let round = 1; round <= totalRounds; round++) {
        let posInRound = 0;
        for (let i = 0; i < n / 2; i++) {
            const home = list[i];
            const away = list[n - 1 - i];

            // Skip matches involving the BYE
            if (!home || !away) continue;

            allInserts.push({
                id: crypto.randomUUID(),
                tournamentId,
                round,
                position: posInRound++,
                participant1Id: home.id,
                participant2Id: away.id,
                nextMatchId: null,
                status: "pending",
                matchStats: {},
                matchConfigSchema: {},
            });
        }

        // Rotate: fix first element, rotate rest
        const last = list.pop()!;
        list.splice(1, 0, last);
    }

    if (allInserts.length > 0) {
        await db.insert(matches).values(allInserts as any);
    }
}


// ─── Free For All ────────────────────────────────────────

async function generateFreeForAll(tournamentId: string, comps: Competitor[]): Promise<void> {
    const n = comps.length;
    // Default group size: 4 (or all if fewer than 8)
    const groupSize = n < 8 ? n : 4;
    const numGroups = Math.ceil(n / groupSize);

    const groups: Competitor[][] = Array.from({ length: numGroups }, () => []);
    // Snake draft into groups by seed
    for (let i = 0; i < n; i++) {
        const groupIdx = i % numGroups;
        groups[groupIdx].push(comps[i]);
    }

    const crypto = await import("crypto");
    const allInserts: Array<{
        id: string;
        tournamentId: string;
        round: number;
        position: number;
        participant1Id: string | null;
        participant2Id: string | null;
        nextMatchId: null;
        status: "pending";
        matchStats: Record<string, unknown>;
        matchConfigSchema: Record<string, unknown>;
    }> = [];

    // Round-robin within each group; encode group as round = group+1
    for (let g = 0; g < groups.length; g++) {
        const group = groups[g];
        let pos = 0;
        for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
                allInserts.push({
                    id: crypto.randomUUID(),
                    tournamentId,
                    round: g + 1,
                    position: pos++,
                    participant1Id: group[i].id,
                    participant2Id: group[j].id,
                    nextMatchId: null,
                    status: "pending",
                    matchStats: {},
                    matchConfigSchema: {},
                });
            }
        }
    }

    if (allInserts.length > 0) {
        await db.insert(matches).values(allInserts as any);
    }
}

// ─── Bye propagation ─────────────────────────────────────

async function propagateByes(tournamentId: string): Promise<void> {
    let changed = true;
    while (changed) {
        changed = false;
        const allMatches = await db
            .select()
            .from(matches)
            .where(eq(matches.tournamentId, tournamentId));

        for (const m of allMatches) {
            if (m.status !== "completed") continue;
            if (!m.nextMatchId) continue;

            const hasP1 = !!m.participant1Id;
            const hasP2 = !!m.participant2Id;
            const winner = hasP1 && !hasP2 ? m.participant1Id
                : !hasP1 && hasP2 ? m.participant2Id
                : m.winnerId;

            if (!winner) continue;

            // Update winner on the bye match itself
            if (!m.winnerId && ((hasP1 && !hasP2) || (!hasP1 && hasP2))) {
                await db
                    .update(matches)
                    .set({ winnerId: winner })
                    .where(eq(matches.id, m.id));
            }

            const next = allMatches.find((nm) => nm.id === m.nextMatchId);
            if (!next) continue;

            // Determine which slot this match feeds into
            const feedsIntoSlot1 = m.position % 2 === 0;
            const slotField = feedsIntoSlot1 ? "participant1Id" : "participant2Id";
            const currentValue = feedsIntoSlot1 ? next.participant1Id : next.participant2Id;

            if (currentValue !== winner) {
                await db
                    .update(matches)
                    .set({ [slotField]: winner })
                    .where(eq(matches.id, next.id));
                changed = true;
            }

            // If the next match now has one participant and the other is a bye, mark it complete
            const updatedNext = await db
                .select()
                .from(matches)
                .where(eq(matches.id, next.id))
                .then((rows) => rows[0]);
            if (updatedNext && updatedNext.status === "pending") {
                const np1 = updatedNext.participant1Id;
                const np2 = updatedNext.participant2Id;
                if ((np1 && !np2) || (!np1 && np2)) {
                    await db
                        .update(matches)
                        .set({ status: "completed", winnerId: np1 || np2 })
                        .where(eq(matches.id, next.id));
                    changed = true;
                }
            }
        }
    }
}

// ─── Public API ──────────────────────────────────────────

export async function generateBracket(tournamentId: string): Promise<void> {
    const [tournament] = await db
        .select()
        .from(tournaments)
        .where(eq(tournaments.id, tournamentId));

    if (!tournament) throw new AppError(404, "Tournament not found");

    if (tournament.status !== "upcoming" && tournament.status !== "ongoing") {
        throw new AppError(
            400,
            `Cannot generate bracket in "${tournament.status}" status. Tournament must be "upcoming" or "ongoing".`,
        );
    }

    await assertNoExistingMatches(tournamentId);

    const comps = await getReadyCompetitors(tournamentId);
    if (comps.length < 2) {
        throw new AppError(400, `Need at least 2 ready competitors, found ${comps.length}.`);
    }

    const type = tournament.bracketType as BracketType;

    switch (type) {
        case "single_elimination":
            await generateSingleElimination(tournamentId, comps);
            break;
        case "double_elimination":
            await generateDoubleElimination(tournamentId, comps);
            break;
        case "round_robin":
            await generateRoundRobin(tournamentId, comps);
            break;
        case "free_for_all":
            await generateFreeForAll(tournamentId, comps);
            break;
        default:
            throw new AppError(400, `Unsupported bracket type: ${type}`);
    }
}

export async function resetBracket(tournamentId: string): Promise<void> {
    const [tournament] = await db
        .select()
        .from(tournaments)
        .where(eq(tournaments.id, tournamentId));

    if (!tournament) throw new AppError(404, "Tournament not found");

    if (tournament.status === "completed") {
        throw new AppError(400, "Cannot reset bracket of a completed tournament.");
    }

    await db.delete(matches).where(eq(matches.tournamentId, tournamentId));
}
