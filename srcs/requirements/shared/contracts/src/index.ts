import { initContract } from "@ts-rest/core";
import { tournamentsContract } from "./endpoints/tournaments";
import { usersContract } from "./endpoints/users";
import { authContract } from "./endpoints/auth";
import { settingsContract } from "./endpoints/settings";
import { handlesContract } from "./endpoints/handles";
import { organizationsContract } from "./endpoints/organizations";
import { chatContract } from "./endpoints/chat";
import { adminContract } from "./endpoints/admin";
import { sportsContract } from "./endpoints/sports";
import { friendsContract } from "./endpoints/friends";
import { matchesContract } from "./endpoints/matches";
import { filesContract } from "./endpoints/files";
import { notificationsContract } from "./endpoints/notifications";
import { ORG_ROLES } from "./constants/roles";
import { 
    TOURNAMENT_PHASES, 
    TOURNAMENT_STRUCTURAL_FIELDS
} from "./constants/tournament_rules";

const c = initContract();

export const contract = c.router({
    tournaments: tournamentsContract,
    auth: authContract,
    users: usersContract,
    settings: settingsContract,
    handles: handlesContract,
    organizations: organizationsContract,
    chat: chatContract,
    admin: adminContract,
    sports: sportsContract,
    friends: friendsContract,
    matches: matchesContract,
    files: filesContract,
    notifications: notificationsContract,
});

export const COMPATIBILITY_CHECK = 1;
export const COMPATIBILITY_CHECK_HEADER = "X-Compatibility-Check";

export { 
    TOURNAMENT_PHASES, 
    TOURNAMENT_STRUCTURAL_FIELDS,
};

export {
    TournamentSchema,
    PublicTournamentSchema,
    PublicTournamentDiscoverySchema,
    TournamentDiscoveryStatusSchema,
    TOURNAMENT_DISCOVERY_STATUSES,
    CreateTournamentSchema,
    UpdateTournamentSchema,
} from "./schemas/tournaments";

export type {
    Tournament,
    PublicTournament,
    PublicTournamentDiscovery,
    CreateTournament,
    UpdateTournament,
} from "./schemas/tournaments";
export * from "./schemas/auth";
export * from "./schemas/users";
export * from "./schemas/settings";
export * from "./schemas/handles";
export * from "./schemas/organizations";
export * from "./schemas/chat";
export * from "./schemas/friends";
export * from "./schemas/matches";
export * from "./schemas/notifications";
export * from "./endpoints/sports";
export * from "./endpoints/files";
export * from "./constants/tournament_rules";
export { defaultSettings } from "./schemas/settings";
export { ORG_ROLES } from "./constants/roles";
export type { OrgRole } from "./constants/roles";