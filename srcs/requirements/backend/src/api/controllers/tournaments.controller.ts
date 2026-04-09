import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import * as TournamentService from "@/services/tournament.service";
import * as LobbyService from "@/services/lobby.service";
import { RequestWithContext } from "@/api/types";
import AppError from "@/utils/error";
import { requireOrgRole } from "@/utils/rbac";

const s = initServer();

export const tournamentsController = s.router(contract.tournaments, {
    createTournament: async ({ params, body, req }: any) => {
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

    listOrgTournaments: async ({ params, req }: any) => {
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

    updateTournament: async ({ params, body, req }: any) => {
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

    deleteTournament: async ({ params, req }: any) => {
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

    getTournamentById: async ({ params }: any) => {
        const response = await TournamentService.discoverTournamentById(params.id);
        return {
            status: 200,
            body: { data: response.data as any },
        };
    },

    getTournaments: async ({ query }: any) => {
        const response = await TournamentService.getTournaments(query);
        return {
            status: 200,
            body: response as any,
        };
    },

    joinLobby: async ({ params, req }: any) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        const tournament = await TournamentService.getTournamentById(params.id);

        if (await TournamentService.isOrgMember(userId, tournament.data.organizationId)) {
            throw new AppError(403, "Organization staff cannot participate in their own tournaments.");
        }

        const result = await LobbyService.joinLobby({
            tournamentId: params.id,
            userId,
            isTO: false,
        });
        return {
            status: 201,
            body: { message: "Joined successfully", state: result.state as any },
        };
    },

    createCompetitor: async ({ params, body, req }: any) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        const tournament = await TournamentService.getTournamentById(params.id);
        const isTO = await TournamentService.isTournamentAdmin(userId, tournament.data.organizationId);

        const result = await LobbyService.createCompetitor({
            tournamentId: params.id,
            userId,
            name: body.name,
            isTO
        });
        return {
            status: 201,
            body: { message: "Competitor created successfully", competitorId: result.competitorId },
        };
    },

    getLobbyState: async ({ params, req }: any) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id || undefined;
        const result = await LobbyService.getLobbyState(params.id, userId);
        return {
            status: 200,
            body: result as any,
        };
    },

    inviteToCompetitor: async ({ params, body, req }: any) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        const tournament = await TournamentService.getTournamentById(params.id);
        const isTO = await TournamentService.isTournamentAdmin(userId, tournament.data.organizationId);

        await LobbyService.inviteToCompetitor({
            tournamentId: params.id,
            competitorId: params.competitorId,
            captainId: userId,
            targetUserId: body.targetUserId,
            isTO
        });
        return {
            status: 201,
            body: { message: "Invitation sent" },
        };
    },

    joinCompetitor: async ({ params, req }: any) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        const tournament = await TournamentService.getTournamentById(params.id);
        const isTO = await TournamentService.isTournamentAdmin(userId, tournament.data.organizationId);

        await LobbyService.joinCompetitor({
            tournamentId: params.id,
            competitorId: params.competitorId,
            userId,
            isTO
        });
        return {
            status: 200,
            body: { message: "Successfully joined competitor" },
        };
    },

    forceReadyCompetitor: async ({ params, req }: any) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        const tournament = await TournamentService.getTournamentById(params.id);
        const isTO = await TournamentService.isTournamentAdmin(userId, tournament.data.organizationId);

        const result = await LobbyService.forceReadyCompetitor(params.competitorId, isTO);
        return {
            status: 200,
            body: result as any,
        };
    },

    assignToCompetitor: async ({ params, body, req }: any) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        const tournament = await TournamentService.getTournamentById(params.id);
        const isTO = await TournamentService.isTournamentAdmin(userId, tournament.data.organizationId);

        await LobbyService.assignToCompetitor(params.competitorId, body.userIds, params.id, isTO);
        return {
            status: 200,
            body: { message: "Players assigned successfully" },
        };
    },

    leaveLobby: async ({ params, req }: any) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        const tournament = await TournamentService.getTournamentById(params.id);
        const isTO = await TournamentService.isTournamentAdmin(userId, tournament.data.organizationId);

        const result = await LobbyService.leaveLobby({
            tournamentId: params.id,
            userId,
            isTO
        });
        return {
            status: 200,
            body: result as any,
        };
    },

    leaveCompetitor: async ({ params, req }: any) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        const tournament = await TournamentService.getTournamentById(params.id);
        const isTO = await TournamentService.isTournamentAdmin(userId, tournament.data.organizationId);

        const result = await LobbyService.leaveCompetitor({
            tournamentId: params.id,
            competitorId: params.competitorId,
            userId,
            isTO
        });
        return {
            status: 200,
            body: result as any,
        };
    },

    ejectFromLobby: async ({ params, body, req }: any) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        const tournament = await TournamentService.getTournamentById(params.id);
        const isTO = await TournamentService.isTournamentAdmin(userId, tournament.data.organizationId);

        const result = await LobbyService.ejectUserFromLobby({
            tournamentId: params.id,
            targetUserId: body.targetUserId,
            isTO,
        });
        return {
            status: 200,
            body: result as any,
        };
    },

    removeCompetitorMember: async ({ params, body, req }: any) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        const tournament = await TournamentService.getTournamentById(params.id);
        const isTO = await TournamentService.isTournamentAdmin(userId, tournament.data.organizationId);

        const result = await LobbyService.removeUserFromCompetitor({
            tournamentId: params.id,
            competitorId: params.competitorId,
            targetUserId: body.targetUserId,
            isTO,
        });
        return {
            status: 200,
            body: result as any,
        };
    },

    declineInvite: async ({ params, req }: any) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        const tournament = await TournamentService.getTournamentById(params.id);
        const isTO = await TournamentService.isTournamentAdmin(userId, tournament.data.organizationId);

        const result = await LobbyService.declineInvite({
            tournamentId: params.id,
            competitorId: params.competitorId,
            userId,
            isTO,
        });
        return { status: 200, body: result as any };
    },

    revokeInvite: async ({ params, req }: any) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        const tournament = await TournamentService.getTournamentById(params.id);
        const isTO = await TournamentService.isTournamentAdmin(userId, tournament.data.organizationId);

        const result = await LobbyService.revokeInvite({
            tournamentId: params.id,
            competitorId: params.competitorId,
            targetUserId: params.targetUserId,
            captainId: userId,
            isTO,
        });
        return { status: 200, body: result as any };
    },

    kickMember: async ({ params, req }: any) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        const tournament = await TournamentService.getTournamentById(params.id);
        const isTO = await TournamentService.isTournamentAdmin(userId, tournament.data.organizationId);

        const result = await LobbyService.kickMember({
            tournamentId: params.id,
            competitorId: params.competitorId,
            targetUserId: params.userId,
            captainId: userId,
            isTO,
        });
        return { status: 200, body: result as any };
    },

    transferCaptain: async ({ params, body, req }: any) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        const tournament = await TournamentService.getTournamentById(params.id);
        const isTO = await TournamentService.isTournamentAdmin(userId, tournament.data.organizationId);

        const result = await LobbyService.transferCaptain({
            tournamentId: params.id,
            competitorId: params.competitorId,
            userId,
            newCaptainUserId: body.newCaptainUserId,
            isTO,
        });
        return { status: 200, body: result as any };
    },

    updateCompetitor: async ({ params, body, req }: any) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        const tournament = await TournamentService.getTournamentById(params.id);
        const isTO = await TournamentService.isTournamentAdmin(userId, tournament.data.organizationId);

        const result = await LobbyService.updateCompetitorInfo({
            tournamentId: params.id,
            competitorId: params.competitorId,
            userId,
            name: body.name,
            isTO,
        });
        return { status: 200, body: result as any };
    },

});

