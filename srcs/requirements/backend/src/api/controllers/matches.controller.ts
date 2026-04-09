import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import * as MatchService from "@/services/match.service";
import * as BracketService from "@/services/bracket.service";
import * as TournamentService from "@/services/tournament.service";
import { RequestWithContext } from "@/api/types";
import { requireOrgRole } from "@/utils/rbac";
import AppError from "@/utils/error";
import { db } from "@/dal/db";
import { matches } from "@/dal/db/schemas/matches";
import { eq } from "drizzle-orm";

const s = initServer();

async function requireTournamentAdmin(req: any, tournamentId: string) {
    const contextReq = req as unknown as RequestWithContext;
    const userId = contextReq.ctx?.decodedToken?.id;
    if (!userId) throw new AppError(401, "Unauthorized");

    const { data: tournament } = await TournamentService.getTournamentById(tournamentId);
    await requireOrgRole(userId, tournament.organizationId, ["owner", "admin"]);
    return { userId, tournament };
}

export const matchesController = s.router(contract.matches, {
    getMatchById: async ({ params }) => {
        const match = await MatchService.getMatch(params.id);
        return { status: 200 as const, body: match as any };
    },

    updateMatch: async ({ params, body, req }: any) => {
        const match = await MatchService.getMatch(params.id);
        await requireTournamentAdmin(req, match.tournamentId);

        const [updated] = await db
            .update(matches)
            .set({ ...body, ...(body.status === undefined ? {} : { status: body.status }) })
            .where(eq(matches.id, params.id))
            .returning();

        return {
            status: 200 as const,
            body: { message: "Match updated", data: updated as any },
        };
    },

    listTournamentMatches: async ({ params }) => {
        const matchList = await MatchService.listTournamentMatches(params.tournamentId);
        return { status: 200 as const, body: matchList as any };
    },

    getBracketState: async ({ params }) => {
        const state = await MatchService.getBracketState(params.tournamentId);
        return { status: 200 as const, body: state as any };
    },

    generateBracket: async ({ params, req }: any) => {
        await requireTournamentAdmin(req, params.tournamentId);
        await BracketService.generateBracket(params.tournamentId);
        const state = await MatchService.getBracketState(params.tournamentId);
        return {
            status: 201 as const,
            body: { message: "Bracket generated successfully", data: state as any },
        };
    },

    resetBracket: async ({ params, req }: any) => {
        await requireTournamentAdmin(req, params.tournamentId);
        await BracketService.resetBracket(params.tournamentId);
        return {
            status: 200 as const,
            body: { message: "Bracket reset successfully" },
        };
    },

    reportScore: async ({ params, body, req }: any) => {
        const match = await MatchService.getMatch(params.id);
        await requireTournamentAdmin(req, match.tournamentId);

        const updated = await MatchService.reportScore(
            params.id,
            body.score1,
            body.score2,
            body.winnerId,
        );

        return {
            status: 200 as const,
            body: { message: "Score reported", data: updated as any },
        };
    },

    getStandings: async ({ params }) => {
        const standings = await MatchService.getStandings(params.tournamentId);
        return { status: 200 as const, body: standings as any };
    },

    advanceSwissRound: async ({ params, req }: any) => {
        await requireTournamentAdmin(req, params.tournamentId);
        const round = await BracketService.generateNextSwissRound(params.tournamentId);
        return {
            status: 201 as const,
            body: { message: `Swiss round ${round} generated`, round },
        };
    },
});
