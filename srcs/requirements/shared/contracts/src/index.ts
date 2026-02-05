import { initContract } from "@ts-rest/core";
import { tournamentsContract } from "./endpoints/tournaments";
import { usersContract } from "./endpoints/users";
import { authContract } from "./endpoints/auth";
import { settingsContract } from "./endpoints/settings";

const c = initContract();

export const contract = c.router({
    tournaments: tournamentsContract,
    auth: authContract,
    users: usersContract,
    settings: settingsContract,
});

export const COMPATIBILITY_CHECK = 1;
export const COMPATIBILITY_CHECK_HEADER = "X-Compatibility-Check";

export * from "./schemas/tournaments";
export * from "./schemas/auth";
export * from "./schemas/users";
export * from "./schemas/settings";

