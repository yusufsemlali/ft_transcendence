import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";

const s = initServer();

export const matchesController = s.router(contract.matches, {
    getMatchById: async () => ({ status: 404, body: { message: "Not implemented" } }),
    updateMatch: async () => ({ status: 404, body: { message: "Not implemented" } }),
    listTournamentMatches: async () => ({ status: 200, body: [] }),
});
