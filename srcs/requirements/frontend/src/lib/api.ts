import { initClient } from "@ts-rest/core";
import { contract } from "@ft-transcendence/contracts";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const api = initClient(contract, {
    baseUrl,
    baseHeaders: {
        "Content-Type": "application/json",
    },
});
