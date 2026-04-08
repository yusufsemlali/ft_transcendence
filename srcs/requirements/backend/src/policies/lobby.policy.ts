import AppError from "@/utils/error";
import { TOURNAMENT_PHASES } from "@ft-transcendence/contracts";

export class LobbyPolicy {

    // Phase lock: what you can do depends entirely on tournament status
    // this is basically the core rule for all lobby actions
    static enforcePhaseLock(tournamentStatus: string, isTO: boolean) {
        
        // ongoing = hard lock, no roster changes at all
        if (tournamentStatus === 'ongoing') {
            throw new AppError(403, "Roster Lock: Cannot modify rosters while the tournament is ongoing.");
        }

        // upcoming = seeding phase
        // players are locked out, only TO can still tweak things
        if (tournamentStatus === 'upcoming' && !isTO) {
            throw new AppError(
                403,
                "Player Lock: Registration is closed. Only a Tournament Organizer can manage rosters at this stage."
            );
        }

        // ended tournaments should be completely immutable
        if (TOURNAMENT_PHASES.ENDED.includes(tournamentStatus as any)) {
            throw new AppError(403, "Tournament has already ended.");
        }
    }

    // "god mode": TO can force a competitor to ready
    // ignores normal constraints like minTeamSize
    static canForceReady(isTO: boolean) {
        if (!isTO) {
            throw new AppError(
                403,
                "God Mode Required: Only Tournament Organizers can force-ready a competitor."
            );
        }
    }

    // TO-only: manually assign players (drag & drop in UI)
    // bypasses normal join/leave flow
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
