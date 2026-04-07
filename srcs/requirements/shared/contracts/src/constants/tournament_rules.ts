export const TOURNAMENT_PHASES = {
    SETUP: ["draft", "registration"], 
    LIVE: ["upcoming", "ongoing"],   
    ENDED: ["completed", "cancelled"] 
} as const;

export const TOURNAMENT_STRUCTURAL_FIELDS = [
    "mode",
    "minTeamSize",
    "maxTeamSize",
    "bracketType",
    "allowDraws",
    "matchConfigSchema"
] as const;

export type TournamentStructuralField = typeof TOURNAMENT_STRUCTURAL_FIELDS[number];
