import { db } from "@/dal/db";
import { tournaments } from "@/dal/db/schemas/tournaments";
import { users } from "@/dal/db/schemas/users";
import { lobby, competitors, rosters, invites } from "@/dal/db/schemas/lobby";
import { eq, and, sql, count, inArray } from "drizzle-orm";
import AppError from "@/utils/error";
import { LobbyPolicy } from "@/policies/lobby.policy";
import { createNotification } from "@/services/notification.service";
import { broadcastLobbyChanged } from "@/services/lobby-sse";

/**
 * 1. JOIN LOBBY (Enter the Building)
 */
export const joinLobby = async ({ tournamentId, userId, isTO = false }: { tournamentId: string; userId: string; isTO?: boolean }) => {
    // Fetch Tournament details
    const [tournament] = await db
        .select()
        .from(tournaments)
        .where(eq(tournaments.id, tournamentId));

    if (!tournament) throw new AppError(404, "Tournament not found");

    // POLICY: Check Phase Lock
    LobbyPolicy.enforcePhaseLock(tournament.status, isTO);

    // Capacity Check
    const [readyCount] = await db
        .select({ value: count() })
        .from(competitors)
        .where(and(
            eq(competitors.tournamentId, tournamentId),
            eq(competitors.status, 'ready')
        ));
    
    if ((readyCount?.value || 0) >= tournament.lobbyCapacity) {
        throw new AppError(403, "Tournament registration is full");
    }

    // Check if already in the building
    const [existing] = await db
        .select()
        .from(lobby)
        .where(and(eq(lobby.tournamentId, tournamentId), eq(lobby.userId, userId)));

    if (existing) throw new AppError(409, "Already in the lobby");

    const [user] = await db.select({ username: users.username }).from(users).where(eq(users.id, userId));

    const result = await db.transaction(async (tx: any) => {
        await tx.insert(lobby).values({
            tournamentId,
            userId,
            status: tournament.maxTeamSize === 1 ? 'rostered' : 'solo'
        });

        if (tournament.maxTeamSize === 1) {
            // Auto-Promote (1v1 flow)
            const [newComp] = await tx.insert(competitors).values({
                tournamentId,
                name: user?.username || 'Solo Player',
                status: 'ready'
            }).returning();

            await tx.insert(rosters).values({
                competitorId: newComp.id,
                userId,
                role: 'captain'
            });
            return { state: 'COMPETITOR_CREATED' };
        }

        return { state: 'LOBBY_JOINED' };
    });
    broadcastLobbyChanged(tournamentId);
    return result;
};

/**
 * 2. FORM COMPETITOR (Form a group)
 */
export const createCompetitor = async ({ tournamentId, userId, name, isTO = false }: { tournamentId: string; userId: string; name: string; isTO?: boolean }) => {
    const [tournament] = await db.select({ status: tournaments.status }).from(tournaments).where(eq(tournaments.id, tournamentId));
    if (!tournament) throw new AppError(404, "Tournament not found");

    LobbyPolicy.enforcePhaseLock(tournament.status, isTO);

    const [player] = await db.select().from(lobby).where(and(eq(lobby.tournamentId, tournamentId), eq(lobby.userId, userId)));
    if (!player) throw new AppError(403, "Must join lobby first");
    if (player.status !== 'solo') throw new AppError(409, "Already rostered");

    const result = await db.transaction(async (tx: any) => {
        const [newComp] = await tx.insert(competitors).values({
            tournamentId,
            name,
            status: 'incomplete', 
        }).returning();

        await tx.insert(rosters).values({
            competitorId: newComp.id,
            userId,
            role: 'captain'
        });

        await tx.update(lobby).set({ status: 'rostered' }).where(eq(lobby.id, player.id));
        return { competitorId: newComp.id };
    });
    broadcastLobbyChanged(tournamentId);
    return result;
};

/**
 * 3. GET LOBBY STATE (See the room)
 */
export const getLobbyState = async (tournamentId: string, userId?: string) => {
    const soloPlayers = await db
        .select({
            userId: users.id,
            username: users.username,
            avatarUrl: users.avatar,
            status: lobby.status,
            joinedAt: lobby.joinedAt,
        })
        .from(lobby)
        .innerJoin(users, eq(lobby.userId, users.id))
        .where(and(eq(lobby.tournamentId, tournamentId), eq(lobby.status, 'solo')));

    const compData = await db
        .select({
            id: competitors.id,
            name: competitors.name,
            status: competitors.status,
            userId: users.id,
            username: users.username,
            role: rosters.role,
        })
        .from(competitors)
        .leftJoin(rosters, eq(competitors.id, rosters.competitorId))
        .leftJoin(users, eq(rosters.userId, users.id))
        .where(eq(competitors.tournamentId, tournamentId));

    const competitorMap = new Map<string, any>();
    for (const c of compData) {
        if (!competitorMap.has(c.id)) {
            competitorMap.set(c.id, { id: c.id, name: c.name, status: c.status, roster: [] });
        }
        if (c.userId) {
            competitorMap.get(c.id).roster.push({ userId: c.userId, username: c.username, role: c.role });
        }
    }

    const result: any = { soloPlayers, competitors: Array.from(competitorMap.values()) };

    if (userId) {
        const inviterUsers = users;
        const pendingInviteRows = await db
            .select({
                inviteId: invites.id,
                competitorId: invites.competitorId,
                competitorName: competitors.name,
                inviterUsername: inviterUsers.username,
                createdAt: invites.createdAt,
            })
            .from(invites)
            .innerJoin(competitors, eq(invites.competitorId, competitors.id))
            .innerJoin(inviterUsers, eq(invites.inviterId, inviterUsers.id))
            .where(and(
                eq(invites.tournamentId, tournamentId),
                eq(invites.targetUserId, userId),
                eq(invites.status, 'pending'),
            ));

        result.pendingInvites = pendingInviteRows;

        const outgoingRows = await db
            .select({
                inviteId: invites.id,
                targetUserId: invites.targetUserId,
            })
            .from(invites)
            .where(and(
                eq(invites.tournamentId, tournamentId),
                eq(invites.inviterId, userId),
                eq(invites.status, 'pending'),
            ));

        result.outgoingInvites = outgoingRows;
    }

    return result;
};

/**
 * 4. INVITE PLAYER
 */
export const inviteToCompetitor = async ({ tournamentId, competitorId, captainId, targetUserId, isTO = false }: any) => {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId));
    if (!tournament) throw new AppError(404, "Tournament not found");
    LobbyPolicy.enforcePhaseLock(tournament.status, isTO);

    if (!isTO) {
        await LobbyPolicy.verifyCaptaincy(competitorId, captainId);
    }

    await LobbyPolicy.enforceInviteCap(competitorId, tournament.maxTeamSize);

    const [target] = await db.select().from(lobby).where(and(eq(lobby.tournamentId, tournamentId), eq(lobby.userId, targetUserId), eq(lobby.status, 'solo')));
    if (!target) throw new AppError(404, "Target not solo in lobby");

    const [comp] = await db.select({ name: competitors.name }).from(competitors).where(eq(competitors.id, competitorId));
    const [captain] = await db.select({ username: users.username }).from(users).where(eq(users.id, captainId));

    await db.insert(invites).values({ tournamentId, competitorId, inviterId: captainId, targetUserId, status: 'pending' })
        .onConflictDoUpdate({ target: [invites.competitorId, invites.targetUserId], set: { status: 'pending' } });

    await createNotification({
        userId: targetUserId,
        type: 'tournament_invite',
        title: `Team invite from ${captain?.username ?? 'Unknown'}`,
        body: `You've been invited to join "${comp?.name ?? 'a team'}"`,
        refId: tournamentId,
    });

    broadcastLobbyChanged(tournamentId);
    return { message: "Invite sent" };
};

/**
 * 5. JOIN COMPETITOR (Accept Invite)
 */
export const joinCompetitor = async ({ tournamentId, competitorId, userId, isTO = false }: any) => {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId));
    LobbyPolicy.enforcePhaseLock(tournament?.status || 'draft', isTO);

    const [invite] = await db.select().from(invites).where(and(eq(invites.competitorId, competitorId), eq(invites.targetUserId, userId), eq(invites.status, 'pending')));
    if (!invite) throw new AppError(403, "No valid invite");

    const [player] = await db.select().from(lobby).where(and(eq(lobby.tournamentId, tournamentId), eq(lobby.userId, userId)));
    if (!player || player.status === 'rostered') throw new AppError(400, "Invalid player state");

    const result = await db.transaction(async (tx: any) => {
        // RACE CONDITION FIX: Count inside the transaction
        const currentRoster = await tx.select().from(rosters).where(eq(rosters.competitorId, competitorId));
        if (currentRoster.length >= (tournament?.maxTeamSize || 1)) {
            throw new AppError(400, "Team is full");
        }

        await tx.insert(rosters).values({ competitorId, userId, role: 'player' });
        await tx.update(lobby).set({ status: 'rostered' }).where(eq(lobby.id, player.id));
        await tx.update(invites).set({ status: 'accepted' }).where(and(eq(invites.competitorId, competitorId), eq(invites.targetUserId, userId)));
        await tx.delete(invites).where(and(eq(invites.targetUserId, userId), eq(invites.status, 'pending')));

        if (currentRoster.length + 1 >= (tournament?.minTeamSize || 1)) {
            await tx.update(competitors).set({ status: 'ready' }).where(eq(competitors.id, competitorId));
        }
        return { message: "Joined" };
    });
    broadcastLobbyChanged(tournamentId);
    return result;
};

/**
 * GOD MODE: FORCE READY
 */
export const forceReadyCompetitor = async (competitorId: string, isTO: boolean) => {
    LobbyPolicy.canForceReady(isTO);
    const [row] = await db
        .select({ tournamentId: competitors.tournamentId })
        .from(competitors)
        .where(eq(competitors.id, competitorId));
    await db.update(competitors).set({ status: 'ready' }).where(eq(competitors.id, competitorId));
    if (row) broadcastLobbyChanged(row.tournamentId);
    return { message: "Competitor forced to ready" };
};

/**
 * GOD MODE: DIRECT ASSIGN
 */
export const assignToCompetitor = async (competitorId: string, userIds: string[], tournamentId: string, isTO: boolean) => {
    LobbyPolicy.canAssignDirectly(isTO);
    
    await db.transaction(async (tx: any) => {
        for (const uid of userIds) {
            const [player] = await tx.select().from(lobby).where(and(eq(lobby.tournamentId, tournamentId), eq(lobby.userId, uid)));
            if (!player) throw new AppError(404, `User ${uid} not in lobby`);
            
            await tx.insert(rosters).values({ competitorId, userId: uid, role: 'player' }).onConflictDoNothing();
            await tx.update(lobby).set({ status: 'rostered' }).where(eq(lobby.id, player.id));
        }
        // Cleanup invites for these users
        await tx.delete(invites).where(inArray(invites.targetUserId, userIds));
        
        // Auto-Ready if they reached min (or just TO choice)
        const [tournament] = await tx.select().from(tournaments).where(eq(tournaments.id, tournamentId));
        const currentRoster = await tx.select().from(rosters).where(eq(rosters.competitorId, competitorId));
        if (currentRoster.length >= (tournament?.minTeamSize || 1)) {
            await tx.update(competitors).set({ status: 'ready' }).where(eq(competitors.id, competitorId));
        }
    });
    broadcastLobbyChanged(tournamentId);
};

/**
 * POLICY 4: LOBBY PURGE (Triggered on Start)
 */
export const purgeLobby = async (tournamentId: string) => {
    await db.transaction(async (tx: any) => {
        // 1. Delete all pending invites
        await tx.delete(invites).where(eq(invites.tournamentId, tournamentId));

        // 2. Disqualify incomplete competitors
        const disqualifiedComps = await tx.update(competitors)
            .set({ status: 'disqualified' })
            .where(and(eq(competitors.tournamentId, tournamentId), eq(competitors.status, 'incomplete')))
            .returning({ id: competitors.id });

        const disqualifiedIds = disqualifiedComps.map((c: any) => c.id);

        if (disqualifiedIds.length > 0) {
            // 2.5 Downgrade players on disqualified teams
            const affectedRosters = await tx.select({ userId: rosters.userId }).from(rosters).where(inArray(rosters.competitorId, disqualifiedIds));
            const affectedUserIds = affectedRosters.map((r: any) => r.userId);
            
            if (affectedUserIds.length > 0) {
                await tx.update(lobby).set({ status: 'spectator' }).where(and(eq(lobby.tournamentId, tournamentId), inArray(lobby.userId, affectedUserIds)));
            }
        }

        // 3. Downgrade solo players to spectators
        await tx.update(lobby)
            .set({ status: 'spectator' })
            .where(and(eq(lobby.tournamentId, tournamentId), eq(lobby.status, 'solo')));
    });
    broadcastLobbyChanged(tournamentId);
};

/**
 * 6. LEAVE LOBBY (Drop out entirely)
 */
export const leaveLobby = async ({ tournamentId, userId, isTO = false }: any) => {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId));
    LobbyPolicy.enforcePhaseLock(tournament?.status || 'draft', isTO);

    const [player] = await db.select().from(lobby).where(and(eq(lobby.tournamentId, tournamentId), eq(lobby.userId, userId)));
    if (!player) throw new AppError(404, "Not in lobby");

    const result = await db.transaction(async (tx: any) => {
        // If they were in a team, they must leaveCompetitor first (or we disband if captain)
        const [userRoster] = await tx.select().from(rosters).innerJoin(competitors, eq(rosters.competitorId, competitors.id)).where(and(eq(competitors.tournamentId, tournamentId), eq(rosters.userId, userId)));
        
        if (userRoster) {
            // Special case: if captain of an incomplete team, disband the whole thing
            if (userRoster.rosters.role === 'captain' && userRoster.competitors.status === 'incomplete') {
                await tx.delete(competitors).where(eq(competitors.id, userRoster.competitors.id));
            } else {
                // Otherwise they must explicitly leave the team first or we block them to prevent ghost rosters
                throw new AppError(400, "Must leave your team/competitor before exiting the lobby");
            }
        }

        await tx.delete(invites).where(eq(invites.targetUserId, userId));
        await tx.delete(lobby).where(eq(lobby.id, player.id));
        
        return { message: "Left lobby successfully" };
    });
    broadcastLobbyChanged(tournamentId);
    return result;
};

/**
 * 7. LEAVE COMPETITOR (Back to Solo)
 */
export const leaveCompetitor = async ({ tournamentId, competitorId, userId, isTO = false }: any) => {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId));
    LobbyPolicy.enforcePhaseLock(tournament?.status || 'draft', isTO);

    const [userRoster] = await db.select().from(rosters).where(and(eq(rosters.competitorId, competitorId), eq(rosters.userId, userId)));
    if (!userRoster) throw new AppError(404, "Not on this roster");

    const result = await db.transaction(async (tx: any) => {
        await tx.delete(rosters).where(and(eq(rosters.competitorId, competitorId), eq(rosters.userId, userId)));
        await tx.update(lobby).set({ status: 'solo' }).where(and(eq(lobby.tournamentId, tournamentId), eq(lobby.userId, userId)));

        // Roster Re-evaluation
        const remaining = await tx.select().from(rosters).where(eq(rosters.competitorId, competitorId));
        
        if (remaining.length === 0) {
            await tx.delete(competitors).where(eq(competitors.id, competitorId));
        } else {
            // Reassign captaincy if the leaver was captain
            if (userRoster.role === 'captain') {
                await tx.update(rosters).set({ role: 'captain' }).where(eq(rosters.id, remaining[0].id));
            }

            // Check if now incomplete
            if (remaining.length < (tournament?.minTeamSize || 1)) {
                await tx.update(competitors).set({ status: 'incomplete' }).where(eq(competitors.id, competitorId));
            }
        }

        return { message: "Left team successfully" };
    });
    broadcastLobbyChanged(tournamentId);
    return result;
};

/**
 * TO: remove a user from a roster; they remain in the lobby as solo.
 */
export const removeUserFromCompetitor = async ({
    tournamentId,
    competitorId,
    targetUserId,
    isTO,
}: {
    tournamentId: string;
    competitorId: string;
    targetUserId: string;
    isTO: boolean;
}) => {
    LobbyPolicy.canAssignDirectly(isTO);

    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId));
    if (!tournament) throw new AppError(404, "Tournament not found");

    LobbyPolicy.enforcePhaseLock(tournament.status, isTO);

    const [comp] = await db
        .select()
        .from(competitors)
        .where(and(eq(competitors.id, competitorId), eq(competitors.tournamentId, tournamentId)));

    if (!comp) throw new AppError(404, "Competitor not found");

    const result = await db.transaction(async (tx: any) => {
        const [userRoster] = await tx
            .select()
            .from(rosters)
            .where(and(eq(rosters.competitorId, competitorId), eq(rosters.userId, targetUserId)));

        if (!userRoster) throw new AppError(404, "User not on this roster");

        await tx.delete(rosters).where(and(eq(rosters.competitorId, competitorId), eq(rosters.userId, targetUserId)));
        await tx
            .update(lobby)
            .set({ status: "solo" })
            .where(and(eq(lobby.tournamentId, tournamentId), eq(lobby.userId, targetUserId)));

        const remaining = await tx.select().from(rosters).where(eq(rosters.competitorId, competitorId));

        if (remaining.length === 0) {
            await tx.delete(competitors).where(eq(competitors.id, competitorId));
        } else {
            if (userRoster.role === "captain") {
                await tx.update(rosters).set({ role: "captain" }).where(eq(rosters.id, remaining[0].id));
            }
            if (remaining.length < (tournament.minTeamSize || 1)) {
                await tx.update(competitors).set({ status: "incomplete" }).where(eq(competitors.id, competitorId));
            }
        }

        return { message: "Removed from team" };
    });
    broadcastLobbyChanged(tournamentId);
    return result;
};

/**
 * TO: fully remove a user from the tournament lobby (and roster if any).
 */
export const ejectUserFromLobby = async ({
    tournamentId,
    targetUserId,
    isTO,
}: {
    tournamentId: string;
    targetUserId: string;
    isTO: boolean;
}) => {
    LobbyPolicy.canEjectUser(isTO);

    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId));
    if (!tournament) throw new AppError(404, "Tournament not found");

    LobbyPolicy.enforcePhaseLock(tournament.status, isTO);

    const [player] = await db
        .select()
        .from(lobby)
        .where(and(eq(lobby.tournamentId, tournamentId), eq(lobby.userId, targetUserId)));
    if (!player) throw new AppError(404, "Player not in lobby");

    const ejectResult = await db.transaction(async (tx: any) => {
        const rosterRows = await tx
            .select()
            .from(rosters)
            .innerJoin(competitors, eq(rosters.competitorId, competitors.id))
            .where(and(eq(competitors.tournamentId, tournamentId), eq(rosters.userId, targetUserId)));

        const userRoster = rosterRows[0];

        if (userRoster) {
            const comp = userRoster.competitors;
            const rosterRow = userRoster.rosters;

            if (rosterRow.role === "captain" && comp.status === "incomplete") {
                await tx.delete(competitors).where(eq(competitors.id, comp.id));
            } else {
                await tx
                    .delete(rosters)
                    .where(and(eq(rosters.competitorId, comp.id), eq(rosters.userId, targetUserId)));

                const remaining = await tx.select().from(rosters).where(eq(rosters.competitorId, comp.id));
                if (remaining.length === 0) {
                    await tx.delete(competitors).where(eq(competitors.id, comp.id));
                } else {
                    if (rosterRow.role === "captain") {
                        await tx.update(rosters).set({ role: "captain" }).where(eq(rosters.id, remaining[0].id));
                    }
                    if (remaining.length < (tournament.minTeamSize || 1)) {
                        await tx.update(competitors).set({ status: "incomplete" }).where(eq(competitors.id, comp.id));
                    }
                }
            }
        }

        await tx.delete(invites).where(eq(invites.targetUserId, targetUserId));
        await tx.delete(lobby).where(eq(lobby.id, player.id));

        return { message: "Player removed from lobby" };
    });
    broadcastLobbyChanged(tournamentId);
    return ejectResult;
};

/**
 * DECLINE INVITE (Solo player rejects a pending team invite)
 */
export const declineInvite = async ({ tournamentId, competitorId, userId, isTO = false }: {
    tournamentId: string;
    competitorId: string;
    userId: string;
    isTO?: boolean;
}) => {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId));
    if (!tournament) throw new AppError(404, "Tournament not found");
    LobbyPolicy.enforcePhaseLock(tournament.status, isTO);

    const [invite] = await db.select().from(invites).where(and(
        eq(invites.competitorId, competitorId),
        eq(invites.targetUserId, userId),
        eq(invites.status, 'pending'),
    ));
    if (!invite) throw new AppError(404, "No pending invite from this team");

    await db.update(invites)
        .set({ status: 'declined' })
        .where(eq(invites.id, invite.id));

    const [comp] = await db.select({ name: competitors.name }).from(competitors).where(eq(competitors.id, competitorId));
    const [player] = await db.select({ username: users.username }).from(users).where(eq(users.id, userId));

    await createNotification({
        userId: invite.inviterId,
        type: 'tournament_invite',
        title: 'Invite declined',
        body: `${player?.username ?? 'A player'} declined the invite to "${comp?.name ?? 'your team'}"`,
        refId: tournamentId,
    });

    broadcastLobbyChanged(tournamentId);
    return { message: "Invite declined" };
};

/**
 * REVOKE INVITE (Captain cancels a sent invite)
 */
export const revokeInvite = async ({ tournamentId, competitorId, targetUserId, captainId, isTO = false }: {
    tournamentId: string;
    competitorId: string;
    targetUserId: string;
    captainId: string;
    isTO?: boolean;
}) => {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId));
    if (!tournament) throw new AppError(404, "Tournament not found");
    LobbyPolicy.enforcePhaseLock(tournament.status, isTO);

    if (!isTO) {
        await LobbyPolicy.verifyCaptaincy(competitorId, captainId);
    }

    const [invite] = await db.select().from(invites).where(and(
        eq(invites.competitorId, competitorId),
        eq(invites.targetUserId, targetUserId),
        eq(invites.status, 'pending'),
    ));
    if (!invite) throw new AppError(404, "No pending invite for this player");

    await db.delete(invites).where(eq(invites.id, invite.id));

    const [comp] = await db.select({ name: competitors.name }).from(competitors).where(eq(competitors.id, competitorId));

    await createNotification({
        userId: targetUserId,
        type: 'tournament_invite',
        title: 'Team invite revoked',
        body: `Your invite to "${comp?.name ?? 'a team'}" has been withdrawn`,
        refId: tournamentId,
    });

    broadcastLobbyChanged(tournamentId);
    return { message: "Invite revoked" };
};

/**
 * KICK MEMBER (Captain removes a player from the roster)
 */
export const kickMember = async ({ tournamentId, competitorId, targetUserId, captainId, isTO = false }: {
    tournamentId: string;
    competitorId: string;
    targetUserId: string;
    captainId: string;
    isTO?: boolean;
}) => {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId));
    if (!tournament) throw new AppError(404, "Tournament not found");
    LobbyPolicy.enforcePhaseLock(tournament.status, isTO);

    if (!isTO) {
        await LobbyPolicy.verifyCaptaincy(competitorId, captainId);
    }

    if (targetUserId === captainId) {
        throw new AppError(400, "Cannot kick yourself. Use leave instead.");
    }

    const [targetRoster] = await db.select().from(rosters).where(and(
        eq(rosters.competitorId, competitorId),
        eq(rosters.userId, targetUserId),
    ));
    if (!targetRoster) throw new AppError(404, "Player not on this roster");

    if (targetRoster.role === 'captain') {
        throw new AppError(400, "Cannot kick the captain. Transfer captaincy first.");
    }

    const kickResult = await db.transaction(async (tx: any) => {
        await tx.delete(rosters).where(and(
            eq(rosters.competitorId, competitorId),
            eq(rosters.userId, targetUserId),
        ));

        await tx.update(lobby)
            .set({ status: 'solo' })
            .where(and(eq(lobby.tournamentId, tournamentId), eq(lobby.userId, targetUserId)));

        const remaining = await tx.select().from(rosters).where(eq(rosters.competitorId, competitorId));
        if (remaining.length < (tournament.minTeamSize || 1)) {
            await tx.update(competitors).set({ status: 'incomplete' }).where(eq(competitors.id, competitorId));
        }

        const [comp] = await db.select({ name: competitors.name }).from(competitors).where(eq(competitors.id, competitorId));

        await createNotification({
            userId: targetUserId,
            type: 'tournament_invite',
            title: 'Removed from team',
            body: `You have been removed from "${comp?.name ?? 'a team'}" by the captain`,
            refId: tournamentId,
        });

        return { message: "Player kicked from team" };
    });
    broadcastLobbyChanged(tournamentId);
    return kickResult;
};

/**
 * TRANSFER CAPTAIN (Pass captaincy to another roster member)
 */
export const transferCaptain = async ({ tournamentId, competitorId, userId, newCaptainUserId, isTO = false }: {
    tournamentId: string;
    competitorId: string;
    userId: string;
    newCaptainUserId: string;
    isTO?: boolean;
}) => {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId));
    if (!tournament) throw new AppError(404, "Tournament not found");
    LobbyPolicy.enforcePhaseLock(tournament.status, isTO);

    await LobbyPolicy.verifyCaptaincy(competitorId, userId);

    if (userId === newCaptainUserId) {
        throw new AppError(400, "You are already the captain.");
    }

    const [newCaptainRoster] = await db.select().from(rosters).where(and(
        eq(rosters.competitorId, competitorId),
        eq(rosters.userId, newCaptainUserId),
    ));
    if (!newCaptainRoster) throw new AppError(404, "Target player is not on this roster");

    const transferResult = await db.transaction(async (tx: any) => {
        await tx.update(rosters)
            .set({ role: 'player' })
            .where(and(eq(rosters.competitorId, competitorId), eq(rosters.userId, userId)));

        await tx.update(rosters)
            .set({ role: 'captain' })
            .where(and(eq(rosters.competitorId, competitorId), eq(rosters.userId, newCaptainUserId)));

        const [comp] = await db.select({ name: competitors.name }).from(competitors).where(eq(competitors.id, competitorId));

        await createNotification({
            userId: newCaptainUserId,
            type: 'tournament_invite',
            title: 'You are now team captain',
            body: `You have been promoted to captain of "${comp?.name ?? 'your team'}"`,
            refId: tournamentId,
        });

        return { message: "Captain transferred" };
    });
    broadcastLobbyChanged(tournamentId);
    return transferResult;
};

/**
 * UPDATE COMPETITOR (Captain renames team, registration phase only)
 */
export const updateCompetitorInfo = async ({ tournamentId, competitorId, userId, name, isTO = false }: {
    tournamentId: string;
    competitorId: string;
    userId: string;
    name?: string;
    isTO?: boolean;
}) => {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId));
    if (!tournament) throw new AppError(404, "Tournament not found");
    LobbyPolicy.enforcePhaseLock(tournament.status, isTO);

    if (!isTO) {
        await LobbyPolicy.verifyCaptaincy(competitorId, userId);
    }

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;

    if (Object.keys(updates).length === 0) {
        throw new AppError(400, "No fields to update");
    }

    await db.update(competitors)
        .set(updates)
        .where(and(eq(competitors.id, competitorId), eq(competitors.tournamentId, tournamentId)));

    broadcastLobbyChanged(tournamentId);
    return { message: "Team updated" };
};


