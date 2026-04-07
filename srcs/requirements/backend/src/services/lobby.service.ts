import { db } from "@/dal/db";
import { tournaments } from "@/dal/db/schemas/tournaments";
import { sports } from "@/dal/db/schemas/sports";
import { users } from "@/dal/db/schemas/users";
import { tournamentPlayers, tournamentEntrants, entrantRosters, tournamentInvites } from "@/dal/db/schemas/lobby";
import { eq, and, sql, count } from "drizzle-orm";
import AppError from "@/utils/error";

export const joinLobby = async ({ tournamentId, userId }: { tournamentId: string; userId: string }) => {
    // 1. Fetch Tournament details
    const [tournament] = await db
        .select({
            status: tournaments.status,
            maxTeamSize: tournaments.maxTeamSize,
            maxParticipants: tournaments.maxParticipants,
        })
        .from(tournaments)
        .where(eq(tournaments.id, tournamentId));

    if (!tournament) {
        throw new AppError(404, "Tournament not found");
    }

    if (tournament.status !== 'registration') {
        throw new AppError(403, "This tournament is not currently open for registration");
    }

    // 2. Capacity Check: Count 'ready' Entrants
    const [entrantCount] = await db
        .select({ value: count() })
        .from(tournamentEntrants)
        .where(and(
            eq(tournamentEntrants.tournamentId, tournamentId),
            eq(tournamentEntrants.status, 'ready')
        ));
    
    if ((entrantCount?.value || 0) >= tournament.maxParticipants) {
        throw new AppError(403, "Tournament registration is full (Capacity reached)");
    }

    // 3. Check if already in the lobby
    const [existingPlayer] = await db
        .select({ id: tournamentPlayers.id })
        .from(tournamentPlayers)
        .where(and(
            eq(tournamentPlayers.tournamentId, tournamentId),
            eq(tournamentPlayers.userId, userId)
        ));

    if (existingPlayer) {
        throw new AppError(409, "You are already in the lobby for this tournament");
    }

    // 3. User info for auto-registrations
    const [user] = await db.select({ username: users.username }).from(users).where(eq(users.id, userId));

    // 4. TRANSACTION: Insert into Lobby. If 1v1, push directly to Entrant.
    return await db.transaction(async (tx: any) => {
        await tx.insert(tournamentPlayers).values({
            tournamentId,
            userId,
            status: tournament.maxTeamSize === 1 ? 'rostered' : 'solo'
        });

        if (tournament.maxTeamSize === 1) {
            // Auto-Promote to Bracket Entrant
            const [newEntrant] = await tx.insert(tournamentEntrants).values({
                tournamentId,
                name: user?.username || 'Solo Player',
                status: 'ready'
            }).returning();

            await tx.insert(entrantRosters).values({
                entrantId: newEntrant.id,
                userId,
                role: 'captain'
            });
            return { state: 'READY_ENTRANT_CREATED' };
        }

        return { state: 'LOBBY_JOINED' };
    });
};

export const createLobbyTeam = async ({ tournamentId, userId, name }: { tournamentId: string; userId: string; name: string }) => {
    // 1. Validate they are actually in the lobby as solo
    const [player] = await db
        .select({ id: tournamentPlayers.id, status: tournamentPlayers.status })
        .from(tournamentPlayers)
        .where(and(
            eq(tournamentPlayers.tournamentId, tournamentId),
            eq(tournamentPlayers.userId, userId)
        ));

    if (!player) {
        throw new AppError(403, "You must enter the Lobby before creating a team");
    }

    if (player.status !== 'solo') {
        throw new AppError(409, "You are already part of an entrant or have a pending invite");
    }

    // 2. TRANSACTION: Create Team, add as Captain, update Lobby status
    return await db.transaction(async (tx: any) => {
        const [newTeam] = await tx.insert(tournamentEntrants).values({
            tournamentId,
            name,
            status: 'incomplete', // Not ready until minTeamSize is reached
        }).returning();

        await tx.insert(entrantRosters).values({
            entrantId: newTeam.id,
            userId,
            role: 'captain'
        });

        await tx.update(tournamentPlayers)
            .set({ status: 'rostered' })
            .where(eq(tournamentPlayers.id, player.id));

        return { teamId: newTeam.id };
    });
};

export const getLobbyState = async (tournamentId: string) => {
    const soloPlayers = await db
        .select({
            userId: users.id,
            username: users.username,
            avatarUrl: users.avatar,
            status: tournamentPlayers.status,
            joinedAt: tournamentPlayers.joinedAt,
        })
        .from(tournamentPlayers)
        .innerJoin(users, eq(tournamentPlayers.userId, users.id))
        .where(and(
            eq(tournamentPlayers.tournamentId, tournamentId),
            sql`${tournamentPlayers.status} != 'rostered'`
        ));

    // 2. Fetch Teams and their Rosters
    const entrants = await db
        .select({
            id: tournamentEntrants.id,
            name: tournamentEntrants.name,
            status: tournamentEntrants.status,
            userId: users.id,
            username: users.username,
            role: entrantRosters.role,
        })
        .from(tournamentEntrants)
        .leftJoin(entrantRosters, eq(tournamentEntrants.id, entrantRosters.entrantId))
        .leftJoin(users, eq(entrantRosters.userId, users.id))
        .where(eq(tournamentEntrants.tournamentId, tournamentId));

    // 3. Group Rosters into Team Objects
    const teamMap = new Map<string, any>();
    for (const e of entrants) {
        if (!teamMap.has(e.id)) {
            teamMap.set(e.id, {
                id: e.id,
                name: e.name,
                status: e.status,
                roster: [],
            });
        }
        if (e.userId) {
            teamMap.get(e.id).roster.push({
                userId: e.userId,
                username: e.username,
                role: e.role,
            });
        }
    }

    return {
        soloPlayers,
        teams: Array.from(teamMap.values()),
    };
};

export const inviteToTeam = async ({ tournamentId, teamId, captainId, targetUserId }: { tournamentId: string; teamId: string; captainId: string; targetUserId: string }) => {
    // 1. Verify Captaincy
    const [captainLink] = await db
        .select()
        .from(entrantRosters)
        .where(and(
            eq(entrantRosters.entrantId, teamId),
            eq(entrantRosters.userId, captainId),
            eq(entrantRosters.role, 'captain')
        ));
    
    if (!captainLink) throw new AppError(403, "Only the team captain can invite players");

    // 2. Verify Target is in Lobby and Solo
    const [target] = await db
        .select()
        .from(tournamentPlayers)
        .where(and(
            eq(tournamentPlayers.tournamentId, tournamentId),
            eq(tournamentPlayers.userId, targetUserId),
            eq(tournamentPlayers.status, 'solo')
        ));
    
    if (!target) throw new AppError(404, "Target user is not available in the lobby");

    // 3. Record Relational Invite
    await db.insert(tournamentInvites).values({
        tournamentId,
        teamId,
        inviterId: captainId,
        targetUserId
    });

    // 4. Update status to 'invited' (signifies they have pending probes)
    await db.update(tournamentPlayers)
        .set({ status: 'invited' })
        .where(eq(tournamentPlayers.id, target.id));

    return { message: "Invitation sent" };
};

export const joinTeam = async ({ tournamentId, teamId, userId }: { tournamentId: string; teamId: string; userId: string }) => {
    // 1. Verify specific invitation exists (SECURITY FIX)
    const [invite] = await db
        .select()
        .from(tournamentInvites)
        .where(and(
            eq(tournamentInvites.teamId, teamId),
            eq(tournamentInvites.targetUserId, userId)
        ));
    
    if (!invite) throw new AppError(403, "You have not been invited to this team");

    // 2. Verify Lobby presence
    const [player] = await db
        .select()
        .from(tournamentPlayers)
        .where(and(
            eq(tournamentPlayers.tournamentId, tournamentId),
            eq(tournamentPlayers.userId, userId)
        ));
    
    if (!player) throw new AppError(404, "You are not in the tournament lobby");
    if (player.status === 'rostered') throw new AppError(400, "You are already in a team");

    // 3. Tournament constraints (min/max size)
    const [tournament] = await db
        .select({
            minParticipants: tournaments.minParticipants,
            maxTeamSize: tournaments.maxTeamSize,
            minTeamSize: tournaments.minTeamSize,
        })
        .from(tournaments)
        .where(eq(tournaments.id, tournamentId));

    // 3. Roster check
    const currentRoster = await db
        .select()
        .from(entrantRosters)
        .where(eq(entrantRosters.entrantId, teamId));
    
    if (currentRoster.length >= (tournament?.maxTeamSize || 1)) {
        throw new AppError(400, "Team is full");
    }

    // 4. TRANSACTION: Move user to Roster and auto-ready team
    return await db.transaction(async (tx: any) => {
        await tx.insert(entrantRosters).values({
            entrantId: teamId,
            userId,
            role: 'player'
        });

        await tx.update(tournamentPlayers)
            .set({ status: 'rostered' })
            .where(eq(tournamentPlayers.id, player.id));
        
        // 4. Cleanup pending invites for this user (they are now rostered)
        await tx.delete(tournamentInvites)
            .where(eq(tournamentInvites.targetUserId, userId));

        // 5. Check if now ready
        if (currentRoster.length + 1 >= (tournament?.minTeamSize || 1)) {
            await tx.update(tournamentEntrants)
                .set({ status: 'ready' })
                .where(eq(tournamentEntrants.id, teamId));
        }

        return { message: "Successfully joined team" };
    });
};
