export const TOURNAMENT_PHASES = {
    SETUP: ["draft", "registration"], 
    LIVE: ["upcoming", "ongoing"],   
    ENDED: ["completed", "cancelled"] 
} as const;

/**
 * Allowed single-step status changes (server enforces the same map).
 * `registration → draft` is handled separately in the backend when the lobby is empty.
 */
export const TOURNAMENT_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
    draft: ["registration"],
    registration: ["upcoming", "cancelled"],
    upcoming: ["ongoing", "cancelled"],
    ongoing: ["completed", "cancelled"],
    cancelled: ["draft", "registration"],
};

export function getOutgoingStatusTransitions(status: string): readonly string[] {
    return TOURNAMENT_STATUS_TRANSITIONS[status] ?? [];
}

/** Short UI copy for confirm modals (key = `${from}->${to}`). */
export const TOURNAMENT_TRANSITION_DESCRIPTIONS: Record<string, string> = {
    "draft->registration":
        "Opens the lobby for registration. If the tournament is public, it becomes discoverable on the browse page.",
    "registration->upcoming":
        "Closes new registrations and marks the event as upcoming. Make sure participants are ready.",
    "registration->cancelled":
        "Cancels the tournament. You can reopen from draft or registration only if no matches exist yet.",
    "registration->draft":
        "Returns to setup. Requires an empty lobby (no players, teams, or pending invites).",
    "upcoming->ongoing":
        "Starts the live phase and permanently clears the waiting room / lobby data for this tournament.",
    "upcoming->cancelled":
        "Cancels before play starts. Reopening is only allowed if no matches exist.",
    "ongoing->completed":
        "Marks the tournament as finished. This should reflect that all play is done.",
    "ongoing->cancelled":
        "Ends the tournament early. Confirm this is intentional.",
    "cancelled->draft":
        "Reopens setup. Requires no matches and an empty lobby if returning to draft.",
    "cancelled->registration":
        "Reopens registration. Only allowed when this tournament has no matches yet.",
};

export function getTransitionDescriptionKey(from: string, to: string): string {
    return `${from}->${to}`;
}

export const TOURNAMENT_STRUCTURAL_FIELDS = [
    "mode",
    "minTeamSize",
    "maxTeamSize",
    "bracketType",
    "allowDraws",
    "matchConfigSchema"
] as const;

export type TournamentStructuralField = typeof TOURNAMENT_STRUCTURAL_FIELDS[number];
