import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import * as TournamentService from "@/services/tournament.service";
import { RequestWithContext } from "@/api/types";
import AppError from "@/utils/error";
import { requireOrgRole } from "@/utils/rbac";

const s = initServer();

export const tournamentsController = s.router(contract.tournaments, {
    createTournament: async ({ params, body, req }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;

        if (!userId) throw new AppError(401, "Unauthorized");

        await requireOrgRole(userId, params.organizationId, ["owner", "admin"]);

        const response = await TournamentService.createTournament(params.organizationId, body);

        return {
            status: 201,
            body: { 
                message: "Tournament created successfully", 
                data: response.data as any 
            },
        };
    },

    listOrgTournaments: async ({ params, req }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;

        if (!userId) throw new AppError(401, "Unauthorized");

        await requireOrgRole(userId, params.organizationId, ["owner", "admin", "member"]);

        const tournaments = await TournamentService.listOrgTournaments(params.organizationId);
        return {
            status: 200,
            body: tournaments as any,
        };
    },

    updateTournament: async ({ params, body, req }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;

        if (!userId) throw new AppError(401, "Unauthorized");

        const tournamentResponse = await TournamentService.getTournamentById(params.id);
        const currentTournament = tournamentResponse.data;

        if (currentTournament.organizationId !== params.organizationId) {
            throw new AppError(403, "Tournament does not belong to this organization.");
        }

        await requireOrgRole(userId, params.organizationId, ["owner", "admin"]);

        const response = await TournamentService.updateTournament(params.id, body);

        return {
            status: 200,
            body: { 
                message: "Tournament updated successfully", 
                data: response.data as any 
            },
        };
    },

    deleteTournament: async ({ params, req }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;

        if (!userId) throw new AppError(401, "Unauthorized");

        const tournamentResponse = await TournamentService.getTournamentById(params.id);
        const currentTournament = tournamentResponse.data;

        if (currentTournament.organizationId !== params.organizationId) {
            throw new AppError(403, "Tournament does not belong to this organization.");
        }

        await requireOrgRole(userId, params.organizationId, ["owner", "admin"]);

        const response = await TournamentService.deleteTournament(params.id);

        if (!response) throw new AppError(500, "Deletion failed");

        return {
            status: 200,
            body: { 
                message: response.message,
                actionTaken: response.actionTaken as any
            },
        };
    },

    getTournamentById: async ({ params }) => {
        const response = await TournamentService.discoverTournamentById(params.id);
        return {
            status: 200,
            body: { data: response.data as any },
        };
    },

    getTournaments: async ({ query }) => {
        const response = await TournamentService.getTournaments(query);
        return {
            status: 200,
            body: response as any,
        };
    },
});
