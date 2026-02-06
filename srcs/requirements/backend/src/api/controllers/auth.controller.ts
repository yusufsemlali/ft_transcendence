import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import * as AuthService from "@/services/auth.service";
import AppError from "@/utils/error";

const s = initServer();

export const authController = s.router(contract.auth, {
    register: async ({ body }) => {
        console.log(`[AUTH] Register: ${body.email}`);
        try {
            const result = await AuthService.register(body.email, body.username, body.password);
            console.log(`[AUTH] Register OK: ${result.user.username}`);
            return { status: 201, body: result };
        } catch (error) {
            if (error instanceof AppError) {
                console.log(`[AUTH] Register FAIL: ${error.status} - ${error.message}`);
                return { status: error.status as 400 | 409, body: { message: error.message } };
            }
            const msg = error instanceof Error ? error.message : "Unknown error";
            console.log(`[AUTH] Register ERROR: ${msg}`);
            return { status: 400, body: { message: "Failed to register user" } };
        }
    },
    login: async ({ body }) => {
        console.log(`[AUTH] Login: ${body.email}`);
        try {
            const result = await AuthService.login(body.email, body.password);
            console.log(`[AUTH] Login OK: ${result.user.username}`);
            return { status: 200, body: result };
        } catch (error) {
            if (error instanceof AppError) {
                console.log(`[AUTH] Login FAIL: ${error.status} - ${error.message}`);
                return { status: error.status as 401, body: { message: error.message } };
            }
            const msg = error instanceof Error ? error.message : "Unknown error";
            console.log(`[AUTH] Login ERROR: ${msg}`);
            return { status: 401, body: { message: "Invalid credentials" } };
        }
    },
});
