import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { 
    TournamentSchema, 
    PublicTournamentSchema, 
    CreateTournamentSchema, 
    UpdateTournamentSchema 
} from "../schemas/tournaments";

const c = initContract();

export const tournamentsContract = c.router({
    createTournament: {
        method: "POST",
        path: "/organizations/:organizationId/tournaments",
        pathParams: z.object({ organizationId: z.string().uuid() }),
        body: CreateTournamentSchema,
        responses: {
            201: z.object({ message: z.string(), data: TournamentSchema }),
            400: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            409: z.object({ message: z.string() }),
        },
        summary: "Create a tournament (Requires: Owner/Admin)",
    },
    listOrgTournaments: {
        method: "GET",
        path: "/organizations/:organizationId/tournaments",
        pathParams: z.object({ organizationId: z.string().uuid() }),
        responses: {
            200: z.array(TournamentSchema),
        },
        summary: "List organization tournaments (Requires: Owner/Admin/Member)",
    },
    updateTournament: {
        method: "PATCH",
        path: "/organizations/:organizationId/tournaments/:id",
        pathParams: z.object({ 
            organizationId: z.string().uuid(),
            id: z.string().uuid() 
        }),
        body: UpdateTournamentSchema,
        responses: {
            200: z.object({ message: z.string(), data: TournamentSchema }),
            400: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
            409: z.object({ message: z.string() }),
        },
        summary: "Update tournament settings (Requires: Owner/Admin)",
    },
    deleteTournament: {
        method: "DELETE",
        path: "/organizations/:organizationId/tournaments/:id",
        pathParams: z.object({
            organizationId: z.string().uuid(),
            id: z.string().uuid(),
        }),
        responses: {
            200: z.object({ 
                message: z.string(), 
                actionTaken: z.enum(['HARD_DELETE', 'CANCELLED']) 
            }),
            401: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Delete or cancel a tournament (Requires: Owner/Admin)",
    },

    getTournamentById: {
        method: "GET",
        path: "/tournaments/:id",
        pathParams: z.object({ id: z.string().uuid() }),
        responses: {
            200: z.object({ data: PublicTournamentSchema }),
            404: z.object({ message: z.string() }),
        },
        summary: "Public Discovery Details (Sanitized)",
    },
    getTournaments: {
        method: "GET",
        path: "/tournaments",
        query: z.object({
            page: z.coerce.number().default(1),
            pageSize: z.coerce.number().default(20),
            search: z.string().optional(),
            sportId: z.string().uuid().optional(),
            status: z.string().optional(),
        }),
        responses: {
            200: z.object({
                tournaments: z.array(PublicTournamentSchema), 
                total: z.number(),
                page: z.number(),
                pageSize: z.number(),
                totalPages: z.number(),
            }),
        },
        summary: "Global Discovery List (Sanitized and Public Only)",
    },

    joinLobby: {
        method: "POST",
        path: "/tournaments/:id/lobby/join",
        pathParams: z.object({ id: z.string().uuid() }),
        body: z.object({}), // empty
        responses: {
            201: z.object({ message: z.string(), state: z.enum(['LOBBY_JOINED', 'READY_ENTRANT_CREATED']) }),
            400: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
            409: z.object({ message: z.string() }),
        },
        summary: "Enter the tournament waiting room (Auto-registers for 1v1s)",
    },
    createLobbyTeam: {
        method: "POST",
        path: "/tournaments/:id/lobby/teams",
        pathParams: z.object({ id: z.string().uuid() }),
        body: z.object({ name: z.string().min(2).max(255) }),
        responses: {
            201: z.object({ message: z.string(), teamId: z.string().uuid() }),
            400: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
            409: z.object({ message: z.string() }),
        },
        summary: "Form a team in the lobby as the Captain",
    },

    getLobbyState: {
        method: "GET",
        path: "/tournaments/:id/lobby",
        pathParams: z.object({ id: z.string().uuid() }),
        responses: {
            200: z.object({
                soloPlayers: z.array(z.object({
                    userId: z.string().uuid(),
                    username: z.string(),
                    avatarUrl: z.string().nullable(),
                    status: z.string(),
                    joinedAt: z.date(),
                })),
                teams: z.array(z.object({
                    id: z.string().uuid(),
                    name: z.string(),
                    status: z.string(),
                    roster: z.array(z.object({
                        userId: z.string().uuid(),
                        username: z.string(),
                        role: z.string(),
                    })),
                })),
            }),
            404: z.object({ message: z.string() }),
        },
        summary: "Get current players and teams in the waiting room",
    },

    inviteToTeam: {
        method: "POST",
        path: "/tournaments/:id/lobby/teams/:teamId/invite",
        pathParams: z.object({ id: z.string().uuid(), teamId: z.string().uuid() }),
        body: z.object({ targetUserId: z.string().uuid() }),
        responses: {
            201: z.object({ message: z.string() }),
            400: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Send an invite to a solo player in the lobby",
    },

    joinTeam: {
        method: "POST",
        path: "/tournaments/:id/lobby/teams/:teamId/join",
        pathParams: z.object({ id: z.string().uuid(), teamId: z.string().uuid() }),
        body: z.object({}),
        responses: {
            200: z.object({ message: z.string() }),
            400: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Accept an invite and join a team roster",
    },
});
