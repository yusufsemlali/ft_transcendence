import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";

const s = initServer();

export const usersController = s.router(contract.users, {
    getMe: async () => {
        return {
            status: 401,
            body: { message: "Not implemented" },
        };
    },
    updateMe: async () => {
        return {
            status: 400,
            body: { message: "Not implemented" },
        };
    },
    getUserById: async () => {
        return {
            status: 404,
            body: { message: "Not implemented" },
        };
    },
});
