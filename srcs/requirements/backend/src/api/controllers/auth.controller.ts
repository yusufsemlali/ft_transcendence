import { createExpressEndpoints } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import * as AuthService from "@/services/auth.service";


export const authRouter = createExpressEndpoints(contract.auth, {
    register: async ({ body }) => {
        try {
            const user = await AuthService.register(body.email, body.username, body.password);
            return {
                status: 201,
                body: user,
            };
        } catch (error) {
            return {
                status: 400,
                body: { message: "Failed to register user" },
            };
        }
    },
    login: async ({ body }) => {
        try {
            const user = await AuthService.login(body.email, body.password);
            return {
                status: 200,
                body: user,
            };
        } catch (error) {
            return {
                status: 401,
                body: { message: "Invalid credentials" },
            };
        }
    },
});