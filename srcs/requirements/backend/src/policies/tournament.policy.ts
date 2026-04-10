import AppError from "@/utils/error";
import { 
    TOURNAMENT_PHASES, 
    TOURNAMENT_STRUCTURAL_FIELDS, 
    TOURNAMENT_STATUS_TRANSITIONS,
    UpdateTournament 
} from "@ft-transcendence/contracts";

type StructuralRow = {
    mode: string;
    minTeamSize: number;
    maxTeamSize: number;
    allowDraws: boolean;
    bracketType: string;
    matchConfigSchema: unknown;
};

export class TournamentPolicy {

    private static valuesEqual(a: unknown, b: unknown): boolean {
        if (a === b) return true;
        try {
            return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
        } catch {
            return false;
        }
    }
    
    static enforceUpdateRules(
        currentStatus: string,
        validatedData: UpdateTournament,
        current: StructuralRow,
    ) {
        const isPastSetupPhase = 
            TOURNAMENT_PHASES.LIVE.includes(currentStatus as any) || 
            TOURNAMENT_PHASES.ENDED.includes(currentStatus as any);

        if (!isPastSetupPhase) return;

        const attemptedStructuralChanges = TOURNAMENT_STRUCTURAL_FIELDS.filter((key) => {
            const k = key as keyof UpdateTournament;
            if (!Object.prototype.hasOwnProperty.call(validatedData, k)) return false;
            const next = validatedData[k];
            if (next === undefined) return false;
            const prev = current[k as keyof StructuralRow];
            return !this.valuesEqual(next, prev);
        });
            
        if (attemptedStructuralChanges.length > 0) {
            throw new AppError(
                403, 
                `Illegal State Transition: Cannot modify ${attemptedStructuralChanges.join(", ")} once the tournament is live, completed, or cancelled.`,
            );
        }
    }

    static getSafeDeletionStrategy(currentStatus: string, participantCount: number): 'HARD_DELETE' | 'CANCEL' {
        if (currentStatus === 'draft' && participantCount === 0) {
            return 'HARD_DELETE';
        }
        
        if (TOURNAMENT_PHASES.ENDED.includes(currentStatus as any)) {
            throw new AppError(
                403,
                "Cannot delete or cancel a tournament that is already completed or cancelled.",
            );
        }

        return 'CANCEL';
    }

    // registration -> draft is allowed in tournament.service only when lobby/competitors/invites are empty
    static enforceStatusTransition(currentStatus: string, newStatus: string) {
        const allowed = TOURNAMENT_STATUS_TRANSITIONS[currentStatus];
        if (!allowed || !allowed.includes(newStatus)) {
            throw new AppError(
                403,
                `Invalid status transition: cannot go from "${currentStatus}" to "${newStatus}".`,
            );
        }
    }

    static enforceCapacityRules(newLobbyCapacity: number | undefined, currentRegistrationCount: number) {
        if (newLobbyCapacity !== undefined) {
            if (newLobbyCapacity < 2) {
                throw new AppError(400, "Lobby capacity cannot be less than 2.");
            }
            if (newLobbyCapacity > 200) {
                throw new AppError(400, "Lobby capacity cannot exceed 200.");
            }
            if (newLobbyCapacity < currentRegistrationCount) {
                throw new AppError(
                    409, 
                    `Cannot lower lobby capacity (${newLobbyCapacity}) below the current number of registered participants (${currentRegistrationCount}).`,
                );
            }
        }
    }
}
