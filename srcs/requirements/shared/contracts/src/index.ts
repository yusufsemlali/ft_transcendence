import { initContract } from "@ts-rest/core";
import { tournamentsContract } from "./endpoints/tournaments";
import { usersContract } from "./endpoints/users";
import { authContract } from "./endpoints/auth";
import { settingsContract } from "./endpoints/settings";
import { gameProfilesContract } from "./endpoints/game_profiles";
import { organizationsContract } from "./endpoints/organizations";
import { adminContract } from "./endpoints/admin";
import { ORG_ROLES } from "./constants/roles";


const c = initContract();

export const contract = c.router({
    tournaments: tournamentsContract,
    auth: authContract,
    users: usersContract,
    settings: settingsContract,
    gameProfiles: gameProfilesContract,
    organizations: organizationsContract,
    admin: adminContract,
});

export const COMPATIBILITY_CHECK = 1;
export const COMPATIBILITY_CHECK_HEADER = "X-Compatibility-Check";

export * from "./schemas/tournaments";
export * from "./schemas/auth";
export * from "./schemas/users";
export * from "./schemas/settings";
export * from "./schemas/game_profiles";
export * from "./schemas/organizations";
export { defaultSettings } from "./schemas/settings";
export { ORG_ROLES, OrgRole } from "./constants/roles";
