import AppError from "@/utils/error";
import { TOURNAMENT_PHASES } from "@ft-transcendence/contracts";

export class LobbyPolicy {
    
    /**
     * Policy 1: The "Phase Lock" Policy
     * What users can do is dictated by the tournaments.status.
     */
    static enforcePhaseLock(tournamentStatus: string, isTO: boolean) {
        // Status 'ongoing': Total Roster Lock.
        if (tournamentStatus === 'ongoing') {
            throw new AppError(403, "Roster Lock: Cannot modify rosters while the tournament is ongoing.");
        }

        // Status 'upcoming' (Seeding Phase): Player lock. 
        // Players cannot leave/join/create, but TOs can.
        if (tournamentStatus === 'upcoming' && !isTO) {
            throw new AppError(403, "Player Lock: Registration is closed. Only a Tournament Organizer can manage rosters at this stage.");
        }

        // Status 'completed' or 'cancelled'
        if (TOURNAMENT_PHASES.ENDED.includes(tournamentStatus as any)) {
            throw new AppError(403, "Tournament has already ended.");
        }
    }

    /**
     * Policy 2: The "God Mode Override" Policy
     * TO can flip a competitor to 'ready' regardless of minTeamSize.
     */
    static canForceReady(isTO: boolean) {
        if (!isTO) {
            throw new AppError(403, "God Mode Required: Only Tournament Organizers can force-ready a competitor.");
        }
    }

    /**
     * Policy 3: The "Drag-and-Drop" Policy
     * TO can assign players directly to competitors.
     */
    static canAssignDirectly(isTO: boolean) {
        if (!isTO) {
            throw new AppError(403, "God Mode Required: Only Tournament Organizers can manually assign players to competitors.");
        }
    }
}
