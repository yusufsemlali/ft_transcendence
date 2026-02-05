import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import * as AuthService from "@/services/auth.service";
import AppError from "@/utils/error";

const s = initServer();

export const authController = s.router(contract.auth, {
    register: async ({ body }) => {
        try {
            const result = await AuthService.register(body.email, body.username, body.password);
            return {
                status: 201,
                body: result,
            };
        } catch (error) {
            if (error instanceof AppError) {
                return {
                    // @ts-ignore
                    status: error.statusCode,
                    body: { message: error.message },
                };
            }
            return {
                status: 400,
                body: { message: "Failed to register user" },
            };
        }
    },
    login: async ({ body }) => {
        try {
            const result = await AuthService.login(body.email, body.password);
            return {
                status: 200,
                body: result,
            };
        } catch (error) {
            if (error instanceof AppError) {
                return {
                    // @ts-ignore
                    status: error.statusCode,
                    body: { message: error.message },
                };
            }
            return {
                status: 401,
                body: { message: "Invalid credentials" },
            };
        }
    },
};
