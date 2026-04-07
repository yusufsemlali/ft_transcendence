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

        if (!userId) return { status: 401, body: { message: "Unauthorized" } };

        try {
            const result = await LobbyService.joinLobby({
                tournamentId: params.id,
                userId,
            });
            return {
                status: 201,
                body: { message: "Joined successfully", state: result.state as any },
            };
        } catch (error) {
            console.error("[LOBBY ERROR] joinLobby:", error);
            if (error instanceof AppError) {
                return { status: error.status as any, body: { message: error.message } };
            }
            return { status: 400, body: { message: "Failed to join lobby" } };
        }
    },

    createLobbyTeam: async ({ params, body, req }: any) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;

        if (!userId) return { status: 401, body: { message: "Unauthorized" } };

        try {
            const result = await LobbyService.createLobbyTeam({
                tournamentId: params.id,
                userId,
                name: body.name
            });
            return {
                status: 201,
                body: { message: "Team created successfully", teamId: result.teamId },
            };
        } catch (error) {
            console.error("[LOBBY ERROR] createLobbyTeam:", error);
            if (error instanceof AppError) {
                return { status: error.status as any, body: { message: error.message } };
            }
            return { status: 400, body: { message: "Failed to create team" } };
        }
    },

    getLobbyState: async ({ params }: any) => {
        try {
            const result = await LobbyService.getLobbyState(params.id);
            return {
                status: 200,
                body: result as any,
            };
        } catch (error) {
            console.error("[LOBBY ERROR] getLobbyState:", error);
            if (error instanceof AppError) {
                return { status: error.status as any, body: { message: error.message } };
            }
            return { status: 404, body: { message: "Lobby not found" } };
        }
    },

    inviteToTeam: async ({ params, body, req }: any) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;

        if (!userId) return { status: 401, body: { message: "Unauthorized" } };

        try {
            await LobbyService.inviteToTeam({
                tournamentId: params.id,
                teamId: params.teamId,
                captainId: userId,
                targetUserId: body.targetUserId,
            });
            return {
                status: 201,
                body: { message: "Invitation sent" },
            };
        } catch (error) {
            console.error("[LOBBY ERROR] inviteToTeam:", error);
            if (error instanceof AppError) {
                return { status: error.status as any, body: { message: error.message } };
            }
            return { status: 400, body: { message: "Failed to send invitation" } };
        }
    },

    joinTeam: async ({ params, req }: any) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;

        if (!userId) return { status: 401, body: { message: "Unauthorized" } };

        try {
            await LobbyService.joinTeam({
                tournamentId: params.id,
                teamId: params.teamId,
                userId,
            });
            return {
                status: 200,
                body: { message: "Successfully joined team" },
            };
        } catch (error) {
            console.error("[LOBBY ERROR] joinTeam:", error);
            if (error instanceof AppError) {
                return { status: error.status as any, body: { message: error.message } };
            }
            return { status: 400, body: { message: "Failed to join team" } };
        }
    },
});
