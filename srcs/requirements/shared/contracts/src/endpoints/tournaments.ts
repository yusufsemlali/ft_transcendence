import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { 
    TournamentSchema, 
    PublicTournamentDiscoverySchema, 
    CreateTournamentSchema, 
    UpdateTournamentSchema,
    TournamentDiscoveryStatusSchema,
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
            200: z.object({ data: PublicTournamentDiscoverySchema }),
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
            status: TournamentDiscoveryStatusSchema.optional(),
        }),
        responses: {
            200: z.object({
                tournaments: z.array(PublicTournamentDiscoverySchema), 
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
        body: z.object({}),
        responses: {
            201: z.object({ 
                message: z.string(), 
                state: z.enum(['LOBBY_JOINED', 'COMPETITOR_CREATED']) 
            }),
            400: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
            409: z.object({ message: z.string() }),
        },
        summary: "Enter the tournament waiting room (Auto-registers for 1v1s)",
    },
    createCompetitor: {
        method: "POST",
        path: "/tournaments/:id/lobby/competitors",
        pathParams: z.object({ id: z.string().uuid() }),
        body: z.object({ name: z.string().min(2).max(255) }),
        responses: {
            201: z.object({ message: z.string(), competitorId: z.string().uuid() }),
            400: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
            409: z.object({ message: z.string() }),
        },
        summary: "Form a team/competitor in the lobby",
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
                    status: z.enum(['solo', 'rostered', 'spectator']),
                    joinedAt: z.date(),
                })),
                competitors: z.array(z.object({
                    id: z.string().uuid(),
                    name: z.string(),
                    status: z.enum(['incomplete', 'ready', 'disqualified']),
                    roster: z.array(z.object({
                        userId: z.string().uuid(),
                        username: z.string(),
                        role: z.enum(['captain', 'player', 'substitute']),
                    })),
                })),
                pendingInvites: z.array(z.object({
                    inviteId: z.string().uuid(),
                    competitorId: z.string().uuid(),
                    competitorName: z.string(),
                    inviterUsername: z.string(),
                    createdAt: z.date(),
                })).optional(),
                /** Pending invites this user sent (captain / TO) — for “Sent” on free-agent rows */
                outgoingInvites: z.array(z.object({
                    inviteId: z.string().uuid(),
                    targetUserId: z.string().uuid(),
                })).optional(),
            }),
            404: z.object({ message: z.string() }),
        },
        summary: "Get current players and competitors in the waiting room",
    },

    inviteToCompetitor: {
        method: "POST",
        path: "/tournaments/:id/lobby/competitors/:competitorId/invite",
        pathParams: z.object({ id: z.string().uuid(), competitorId: z.string().uuid() }),
        body: z.object({ targetUserId: z.string().uuid() }),
        responses: {
            201: z.object({ message: z.string() }),
            400: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Send an invite to a solo player in the lobby",
    },

    joinCompetitor: {
        method: "POST",
        path: "/tournaments/:id/lobby/competitors/:competitorId/join",
        pathParams: z.object({ id: z.string().uuid(), competitorId: z.string().uuid() }),
        body: z.object({}),
        responses: {
            200: z.object({ message: z.string() }),
            400: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Accept an invite and join a competitor roster",
    },

    leaveLobby: {
        method: "POST",
        path: "/tournaments/:id/lobby/leave",
        pathParams: z.object({ id: z.string().uuid() }),
        body: z.object({}),
        responses: {
            200: z.object({ message: z.string() }),
            400: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Leave the tournament waiting room",
    },

    leaveCompetitor: {
        method: "POST",
        path: "/tournaments/:id/lobby/competitors/:competitorId/leave",
        pathParams: z.object({ id: z.string().uuid(), competitorId: z.string().uuid() }),
        body: z.object({}),
        responses: {
            200: z.object({ message: z.string() }),
            400: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Leave a competitor roster and return to solo lobby status",
    },

    ejectFromLobby: {
        method: "POST",
        path: "/tournaments/:id/lobby/eject",
        pathParams: z.object({ id: z.string().uuid() }),
        body: z.object({ targetUserId: z.string().uuid() }),
        responses: {
            200: z.object({ message: z.string() }),
            400: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Remove a user from the tournament lobby entirely (TO only)",
    },

    removeCompetitorMember: {
        method: "POST",
        path: "/tournaments/:id/lobby/competitors/:competitorId/remove-member",
        pathParams: z.object({ id: z.string().uuid(), competitorId: z.string().uuid() }),
        body: z.object({ targetUserId: z.string().uuid() }),
        responses: {
            200: z.object({ message: z.string() }),
            400: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Remove a user from a competitor roster back to solo lobby (TO only)",
    },

    forceReadyCompetitor: {
        method: "PATCH",
        path: "/tournaments/:id/lobby/competitors/:competitorId/force-ready",
        pathParams: z.object({ id: z.string().uuid(), competitorId: z.string().uuid() }),
        body: z.object({}),
        responses: {
            200: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Bypass minTeamSize and manually set competitor to 'ready' (TO Only)",
    },

    assignToCompetitor: {
        method: "POST",
        path: "/tournaments/:id/lobby/competitors/:competitorId/assign",
        pathParams: z.object({ id: z.string().uuid(), competitorId: z.string().uuid() }),
        body: z.object({ userIds: z.array(z.string().uuid()) }),
        responses: {
            200: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Directly assign players to a competitor (TO Only, bypasses invites)",
    },

    declineInvite: {
        method: "POST",
        path: "/tournaments/:id/lobby/competitors/:competitorId/decline",
        pathParams: z.object({ id: z.string().uuid(), competitorId: z.string().uuid() }),
        body: z.object({}),
        responses: {
            200: z.object({ message: z.string() }),
            400: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Decline a pending team invite (Solo player)",
    },

    revokeInvite: {
        method: "DELETE",
        path: "/tournaments/:id/lobby/competitors/:competitorId/invites/:targetUserId",
        pathParams: z.object({
            id: z.string().uuid(),
            competitorId: z.string().uuid(),
            targetUserId: z.string().uuid(),
        }),
        body: z.object({}),
        responses: {
            200: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Revoke a pending invite sent to a player (Captain)",
    },

    kickMember: {
        method: "DELETE",
        path: "/tournaments/:id/lobby/competitors/:competitorId/members/:userId",
        pathParams: z.object({
            id: z.string().uuid(),
            competitorId: z.string().uuid(),
            userId: z.string().uuid(),
        }),
        body: z.object({}),
        responses: {
            200: z.object({ message: z.string() }),
            400: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Remove a player from the roster (Captain)",
    },

    transferCaptain: {
        method: "PATCH",
        path: "/tournaments/:id/lobby/competitors/:competitorId/captain",
        pathParams: z.object({ id: z.string().uuid(), competitorId: z.string().uuid() }),
        body: z.object({ newCaptainUserId: z.string().uuid() }),
        responses: {
            200: z.object({ message: z.string() }),
            400: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Transfer captain role to another roster member",
    },

    updateCompetitor: {
        method: "PATCH",
        path: "/tournaments/:id/lobby/competitors/:competitorId",
        pathParams: z.object({ id: z.string().uuid(), competitorId: z.string().uuid() }),
        body: z.object({ name: z.string().min(2).max(255).optional() }),
        responses: {
            200: z.object({ message: z.string() }),
            400: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
        },
        summary: "Update team name (Captain, registration phase only)",
    },

});
