import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import { RequestWithContext } from "@/api/types";
import AppError from "@/utils/error";
import { db } from "@/dal/db";
import { organizations, organizationMembers } from "@/dal/db/schemas/organizations";

const s = initServer();

export const organizationsController = s.router(contract.organizations, {
    createOrganization: async ({ body, req }) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;

        if (!userId || contextReq.ctx?.decodedToken?.type === "None") {
            throw new AppError(401, "Must be logged in to create an organization");
        }

        // 1. Create the Organization
        const [newOrg] = await db.insert(organizations).values({
            name: body.name,
            slug: body.slug,
            description: body.description,
        }).returning();

        // 2. Make the creator the 'owner' in the junction table
        await db.insert(organizationMembers).values({
            organizationId: newOrg.id,
            userId: userId,
            role: 'owner'
        });

        return {
            status: 201 as const,
            body: {
                message: "Organization created successfully",
                data: newOrg as any
            }
        };
    }
});
