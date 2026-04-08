import AppError from "@/utils/error";
import { 
    TOURNAMENT_PHASES, 
    TOURNAMENT_STRUCTURAL_FIELDS, 
    UpdateTournament 
} from "@ft-transcendence/contracts";

export class TournamentPolicy {
    
    static enforceUpdateRules(currentStatus: string, validatedData: UpdateTournament) {
        const isPastSetupPhase = 
            TOURNAMENT_PHASES.LIVE.includes(currentStatus as any) || 
            TOURNAMENT_PHASES.ENDED.includes(currentStatus as any);

        if (isPastSetupPhase) {
            const attemptedStructuralChanges = Object.keys(validatedData).filter(key => 
                TOURNAMENT_STRUCTURAL_FIELDS.includes(key as any)
            );
            
            if (attemptedStructuralChanges.length > 0) {
                throw new AppError(
                    403, 
                    `Illegal State Transition: Cannot modify ${attemptedStructuralChanges.join(', ')} once the tournament is live or completed.`
                );
            }
        }
    }

    static getSafeDeletionStrategy(currentStatus: string, participantCount: number): 'HARD_DELETE' | 'CANCEL' {
        if (currentStatus === 'draft' && participantCount === 0) {
            return 'HARD_DELETE';
        }
        
        if (TOURNAMENT_PHASES.ENDED.includes(currentStatus as any)) {
            throw new AppError(403, "Cannot delete or cancel a tournament that has already been completed.");
        }

        return 'CANCEL';
    }

    // registration -> draft is allowed in tournament.service only when lobby/competitors/invites are empty
    private static readonly VALID_TRANSITIONS: Record<string, string[]> = {
        draft:        ['registration'],
        registration: ['upcoming', 'cancelled'],
        upcoming:     ['ongoing', 'cancelled'],
        ongoing:      ['completed', 'cancelled'],
    };

    static enforceStatusTransition(currentStatus: string, newStatus: string) {
        const allowed = this.VALID_TRANSITIONS[currentStatus];
        if (!allowed || !allowed.includes(newStatus)) {
            throw new AppError(
                403,
                `Invalid status transition: cannot go from "${currentStatus}" to "${newStatus}".`
            );
        }
    }

    static enforceCapacityRules(newMaxParticipants: number | undefined, currentRegistrationCount: number) {
        if (newMaxParticipants !== undefined) {
            if (newMaxParticipants < 2) {
                throw new AppError(400, "Maximum participants cannot be less than 2.");
            }
            if (newMaxParticipants < currentRegistrationCount) {
                throw new AppError(
                    409, 
                    `Cannot lower maximum participants (${newMaxParticipants}) below the current number of registered participants (${currentRegistrationCount}).`
                );
            }
        }
    }
}
