import AppError from "@/utils/error";
import { TOURNAMENT_PHASES } from "@ft-transcendence/contracts";
import { db } from "@/dal/db";
import { rosters, invites } from "@/dal/db/schemas/lobby";
import { eq, and, count } from "drizzle-orm";

export class LobbyPolicy {

    static enforcePhaseLock(tournamentStatus: string, isTO: boolean) {
        if (tournamentStatus === 'ongoing') {
            throw new AppError(403, "Roster Lock: Cannot modify rosters while the tournament is ongoing.");
        }

        if (tournamentStatus === 'upcoming' && !isTO) {
            throw new AppError(
                403,
                "Player Lock: Registration is closed. Only a Tournament Organizer can manage rosters at this stage."
            );
        }

        if (TOURNAMENT_PHASES.ENDED.includes(tournamentStatus as any)) {
            throw new AppError(403, "Tournament has already ended.");
        }
    }

    static async verifyCaptaincy(competitorId: string, userId: string): Promise<void> {
        const [captain] = await db
            .select()
            .from(rosters)
            .where(and(
                eq(rosters.competitorId, competitorId),
                eq(rosters.userId, userId),
                eq(rosters.role, 'captain'),
            ));

        if (!captain) {
            throw new AppError(403, "Only the team captain can perform this action.");
        }
    }

    static async enforceInviteCap(competitorId: string, maxTeamSize: number): Promise<void> {
        const [pendingCount] = await db
            .select({ value: count() })
            .from(invites)
            .where(and(
                eq(invites.competitorId, competitorId),
                eq(invites.status, 'pending'),
            ));

        const currentRoster = await db
            .select()
            .from(rosters)
            .where(eq(rosters.competitorId, competitorId));

        const openSlots = maxTeamSize - currentRoster.length;
        if ((pendingCount?.value ?? 0) >= openSlots) {
            throw new AppError(
                400,
                "Invite cap reached: you have as many pending invites as open roster slots.",
            );
        }
    }

    static canForceReady(isTO: boolean) {
        if (!isTO) {
            throw new AppError(
                403,
                "God Mode Required: Only Tournament Organizers can force-ready a competitor."
            );
        }
    }

    static canAssignDirectly(isTO: boolean) {
        if (!isTO) {
            throw new AppError(
                403,
                "God Mode Required: Only Tournament Organizers can manually assign players to competitors."
            );
        }
    }

    static canEjectUser(isTO: boolean) {
        if (!isTO) {
            throw new AppError(
                403,
                "God Mode Required: Only Tournament Organizers can remove players from the lobby."
            );
        }
    }
}
