import AppError from "@/utils/error";
import { 
    TOURNAMENT_PHASES, 
    TOURNAMENT_STRUCTURAL_FIELDS, 
    TOURNAMENT_PROTECTED_FIELDS, 
    UpdateTournament 
} from "@ft-transcendence/contracts";

export class TournamentPolicy {
    
    static enforceModifiableFields(attemptedData: Record<string, any>) {
        const violations = Object.keys(attemptedData).filter(key => 
            (TOURNAMENT_PROTECTED_FIELDS as readonly string[]).includes(key)
        );

        if (violations.length > 0) {
            throw new AppError(
                400, 
                `Validation Error: The following fields are protected and cannot be modified: ${violations.join(', ')}`
            );
        }
    }

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
