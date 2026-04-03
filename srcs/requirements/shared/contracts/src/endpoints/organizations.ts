import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { OrganizationSchema, CreateOrganizationSchema } from "../schemas/organizations";

const c = initContract();

export const organizationsContract = c.router({
    createOrganization: {
        method: "POST",
        path: "/organizations",
        body: CreateOrganizationSchema,
        responses: {
            201: z.object({ message: z.string(), data: OrganizationSchema }),
            400: z.object({ message: z.string() }),
            401: z.object({ message: z.string() }),
        },
        summary: "Create a new organization",
    },
});
