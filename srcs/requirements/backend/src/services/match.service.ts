import { db } from "@/dal/db";
import { matches } from "@/dal/db/schemas/matches";
import { competitors } from "@/dal/db/schemas/lobby";
import { tournaments } from "@/dal/db/schemas/tournaments";
import { eq } from "drizzle-orm";
import AppError from "@/utils/error";
import type {
    AdminMatchUpdate,
    BracketState,
    BracketParticipant,
    BracketRound,
    BracketMatch,
    StandingsEntry,
} from "@ft-transcendence/contracts";

// ─── Helpers ─────────────────────────────────────────────

function getRoundLabel(round: number, totalRounds: number, bracketType: string): string {
    if (bracketType === "round_robin") return `Round ${round}`;
    if (bracketType === "free_for_all") return `Group ${round}`;

    if (round >= 200) return "Grand Finals";
    if (round >= 100) {
        const lr = round - 100;
        return `Losers Round ${lr}`;
    }

    const remaining = totalRounds - round;
    if (remaining === 0) return "Finals";
    if (remaining === 1) return "Semifinals";
    if (remaining === 2) return "Quarterfinals";
    const size = Math.pow(2, remaining + 1);
    return `Round of ${size}`;
}

function getRoundSection(round: number): "winners" | "losers" | "grand_finals" | undefined {
    if (round >= 200) return "grand_finals";
    if (round >= 100) return "losers";
    return "winners";
}

// ─── Score updates (no completion) ───────────────────────

/** Update displayed scores only — match stays pending/ongoing; no bracket advancement. */
export async function patchMatchScores(
    matchId: string,
    score1: number,
    score2: number,
): Promise<typeof matches.$inferSelect> {
    const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
    if (!match) throw new AppError(404, "Match not found");

    if (match.status === "completed") {
        throw new AppError(409, "Scores cannot be changed on a completed match. Use dispute flow if needed.");
    }
    if (match.status === "cancelled") {
        throw new AppError(409, "Cannot update scores for a cancelled match.");
    }

    const [updated] = await db
        .update(matches)
        .set({ score1, score2 })
        .where(eq(matches.id, matchId))
        .returning();

    return updated!;
}

// ─── Finalize result (complete + advance) ─────────────────

export async function finalizeMatchResult(
    matchId: string,
    score1: number,
    score2: number,
    winnerId?: string,
): Promise<typeof matches.$inferSelect> {
    const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
    if (!match) throw new AppError(404, "Match not found");

    if (match.status === "completed") {
        throw new AppError(409, "Match is already completed.");
    }
    if (match.status === "cancelled") {
        throw new AppError(409, "Cannot finalize a cancelled match.");
    }

    let resolvedWinner = winnerId ?? null;
    if (!resolvedWinner) {
        if (score1 > score2 && match.participant1Id) {
            resolvedWinner = match.participant1Id;
        } else if (score2 > score1 && match.participant2Id) {
            resolvedWinner = match.participant2Id;
        }
    }

    const [updated] = await db
        .update(matches)
        .set({
            score1,
            score2,
            winnerId: resolvedWinner,
            status: "completed",
            completedAt: new Date(),
        })
        .where(eq(matches.id, matchId))
        .returning();

    if (resolvedWinner && updated.nextMatchId) {
        await advanceWinner(updated, resolvedWinner);
    }

    if (resolvedWinner) {
        const [tournament] = await db
            .select()
            .from(tournaments)
            .where(eq(tournaments.id, match.tournamentId));

        if (tournament?.bracketType === "single_elimination") {
            const loserId =
                resolvedWinner === match.participant1Id ? match.participant2Id : match.participant1Id;
            if (loserId) {
                await db
                    .update(competitors)
                    .set({ status: "disqualified" })
                    .where(eq(competitors.id, loserId));
            }
        }
    }

    return updated!;
}

async function advanceWinner(match: typeof matches.$inferSelect, winnerId: string): Promise<void> {
    if (!match.nextMatchId) return;

    const [nextMatch] = await db.select().from(matches).where(eq(matches.id, match.nextMatchId));
    if (!nextMatch) return;

    // Determine which slot to fill based on match position
    const feedsIntoSlot1 = match.position % 2 === 0;
    const field = feedsIntoSlot1 ? "participant1Id" : "participant2Id";

    await db
        .update(matches)
        .set({ [field]: winnerId })
        .where(eq(matches.id, nextMatch.id));
}

// ─── Get Single Match ────────────────────────────────────

export async function getMatch(matchId: string) {
    const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
    if (!match) throw new AppError(404, "Match not found");
    return match;
}

function assertAdminStatusTransition(
    from: (typeof matches.$inferSelect)["status"],
    to: (typeof matches.$inferSelect)["status"],
): void {
    if (from === to) return;
    if (to === "completed") {
        throw new AppError(400, "Use POST /matches/:id/finalize to complete a match and record results.");
    }
    const allowed: Record<string, string[]> = {
        pending: ["ongoing", "cancelled", "disputed"],
        ongoing: ["pending", "cancelled", "disputed"],
        completed: ["disputed"],
        disputed: ["pending", "ongoing", "cancelled"],
        cancelled: ["pending"],
    };
    if (!allowed[from]?.includes(to)) {
        throw new AppError(400, `Invalid status transition (${from} → ${to}).`);
    }
}

/** Tournament admin: reschedule or set live/offline state without recording results. */
export async function adminPatchMatch(
    matchId: string,
    patch: AdminMatchUpdate,
): Promise<typeof matches.$inferSelect> {
    const match = await getMatch(matchId);

    const updates: Partial<typeof matches.$inferSelect> = {};

    if (patch.scheduledAt !== undefined) {
        updates.scheduledAt = patch.scheduledAt;
    }

    if (patch.status !== undefined) {
        assertAdminStatusTransition(match.status, patch.status);
        updates.status = patch.status;
    }

    if (Object.keys(updates).length === 0) {
        throw new AppError(400, "No fields to update");
    }

    const [updated] = await db
        .update(matches)
        .set(updates)
        .where(eq(matches.id, matchId))
        .returning();

    return updated!;
}

// ─── List Tournament Matches ─────────────────────────────

export async function listTournamentMatches(tournamentId: string) {
    return db
        .select()
        .from(matches)
        .where(eq(matches.tournamentId, tournamentId));
}

// ─── Bracket State Assembly ──────────────────────────────

export async function getBracketState(tournamentId: string): Promise<BracketState> {
    const [tournament] = await db
        .select()
        .from(tournaments)
        .where(eq(tournaments.id, tournamentId));

    if (!tournament) throw new AppError(404, "Tournament not found");

    const allMatches = await db
        .select()
        .from(matches)
        .where(eq(matches.tournamentId, tournamentId));

    const allCompetitors = await db
        .select()
        .from(competitors)
        .where(eq(competitors.tournamentId, tournamentId));

    // Build participant lookup
    const participantMap = new Map<string, BracketParticipant>();
    for (const c of allCompetitors) {
        participantMap.set(c.id, {
            id: c.id,
            name: c.name,
            seed: c.seed,
            imageUrl: null,
            status: c.status === "disqualified" ? "disqualified"
                : c.status === "ready" ? "active"
                : "eliminated",
        });
    }

    // Group matches by round
    const roundMap = new Map<number, typeof allMatches>();
    for (const m of allMatches) {
        if (!roundMap.has(m.round)) roundMap.set(m.round, []);
        roundMap.get(m.round)!.push(m);
    }

    // Determine total winners rounds for label computation
    const winnersRounds = allMatches
        .filter((m) => m.round < 100)
        .reduce((max, m) => Math.max(max, m.round), 0);

    const bracketType = tournament.bracketType;
    const isDoubleElim = bracketType === "double_elimination";

    // Build rounds
    const rounds: BracketRound[] = [];
    const sortedRoundNumbers = [...roundMap.keys()].sort((a, b) => a - b);

    for (const roundNum of sortedRoundNumbers) {
        const roundMatches = roundMap.get(roundNum)!.sort((a, b) => a.position - b.position);

        const bracketMatches: BracketMatch[] = roundMatches.map((m) => ({
            id: m.id,
            position: m.position,
            participant1: m.participant1Id ? (participantMap.get(m.participant1Id) ?? null) : null,
            participant2: m.participant2Id ? (participantMap.get(m.participant2Id) ?? null) : null,
            score1: m.score1 ?? 0,
            score2: m.score2 ?? 0,
            winnerId: m.winnerId,
            status: m.status as BracketMatch["status"],
            nextMatchId: m.nextMatchId,
            scheduledAt: m.scheduledAt ?? null,
            completedAt: m.completedAt ?? null,
        }));

        const section = isDoubleElim ? getRoundSection(roundNum) : undefined;
        const labelRounds = section === "losers" ? 0 : winnersRounds;
        const label = getRoundLabel(roundNum, labelRounds, bracketType);

        rounds.push({
            number: roundNum,
            label,
            section,
            matches: bracketMatches,
        });
    }

    // Compute standings
    const standings = computeStandings(allMatches, allCompetitors, bracketType);

    // Determine current round
    const incompleteRounds = sortedRoundNumbers.filter((r) => {
        const rm = roundMap.get(r)!;
        return rm.some((m) => m.status === "pending" || m.status === "ongoing");
    });
    const currentRound = incompleteRounds.length > 0 ? Math.min(...incompleteRounds) : (sortedRoundNumbers[sortedRoundNumbers.length - 1] ?? 0);

    const metadata = {
        totalRounds: sortedRoundNumbers.length,
        currentRound,
        ...(isDoubleElim && {
            winnersRounds,
            losersRounds: allMatches.filter((m) => m.round >= 100 && m.round < 200).reduce((max, m) => Math.max(max, m.round - 100), 0),
            hasGrandFinals: allMatches.some((m) => m.round >= 200),
        }),
        ...(bracketType === "free_for_all" && {
            groups: new Set(allMatches.map((m) => m.round)).size,
        }),
    };

    return {
        tournamentId,
        bracketType: bracketType as BracketState["bracketType"],
        status: tournament.status as BracketState["status"],
        participants: [...participantMap.values()],
        rounds,
        standings,
        metadata,
    };
}

// ─── Standings Computation ───────────────────────────────

function computeStandings(
    allMatches: (typeof matches.$inferSelect)[],
    allCompetitors: (typeof competitors.$inferSelect)[],
    bracketType: string,
): StandingsEntry[] {
    const stats = new Map<
        string,
        {
            wins: number;
            losses: number;
            draws: number;
            points: number;
            matchesPlayed: number;
            goalsFor: number;
            goalsAgainst: number;
            opponents: string[];
        }
    >();

    for (const c of allCompetitors) {
        stats.set(c.id, {
            wins: 0,
            losses: 0,
            draws: 0,
            points: 0,
            matchesPlayed: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            opponents: [],
        });
    }

    const completedMatches = allMatches.filter((m) => m.status === "completed");

    for (const m of completedMatches) {
        const p1 = m.participant1Id;
        const p2 = m.participant2Id;
        if (!p1 || !p2) continue;

        const s1 = stats.get(p1);
        const s2 = stats.get(p2);
        if (!s1 || !s2) continue;

        s1.matchesPlayed++;
        s2.matchesPlayed++;
        s1.goalsFor += m.score1 ?? 0;
        s1.goalsAgainst += m.score2 ?? 0;
        s2.goalsFor += m.score2 ?? 0;
        s2.goalsAgainst += m.score1 ?? 0;
        s1.opponents.push(p2);
        s2.opponents.push(p1);

        if (m.winnerId === p1) {
            s1.wins++;
            s1.points += 3;
            s2.losses++;
        } else if (m.winnerId === p2) {
            s2.wins++;
            s2.points += 3;
            s1.losses++;
        } else {
            // Draw
            s1.draws++;
            s2.draws++;
            s1.points += 1;
            s2.points += 1;
        }
    }


    const participantMap = new Map(allCompetitors.map((c) => [c.id, c]));

    const entries: StandingsEntry[] = [...stats.entries()].map(([id, s]) => {
        const comp = participantMap.get(id)!;
        return {
            rank: 0,
            participant: {
                id: comp.id,
                name: comp.name,
                seed: comp.seed,
                imageUrl: null,
                status: (comp.status === "disqualified" ? "disqualified" : "active") as BracketParticipant["status"],
            },
            wins: s.wins,
            losses: s.losses,
            draws: s.draws,
            points: s.points,
            matchesPlayed: s.matchesPlayed,
            ...(["round_robin", "free_for_all"].includes(bracketType) && {
                goalsFor: s.goalsFor,
                goalsAgainst: s.goalsAgainst,
                goalDifference: s.goalsFor - s.goalsAgainst,
            }),
        };
    });

    // Sort: points desc, then tiebreakers
    entries.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        const gdA = (a.goalDifference ?? 0);
        const gdB = (b.goalDifference ?? 0);
        if (gdB !== gdA) return gdB - gdA;
        return (a.participant.seed ?? Infinity) - (b.participant.seed ?? Infinity);
    });

    entries.forEach((e, i) => {
        e.rank = i + 1;
    });

    return entries;
}

export async function getStandings(tournamentId: string): Promise<StandingsEntry[]> {
    const [tournament] = await db
        .select()
        .from(tournaments)
        .where(eq(tournaments.id, tournamentId));

    if (!tournament) throw new AppError(404, "Tournament not found");

    const allMatches = await db
        .select()
        .from(matches)
        .where(eq(matches.tournamentId, tournamentId));

    const allCompetitors = await db
        .select()
        .from(competitors)
        .where(eq(competitors.tournamentId, tournamentId));

    return computeStandings(allMatches, allCompetitors, tournament.bracketType);
}
