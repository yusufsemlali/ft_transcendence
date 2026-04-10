import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import { db } from "@/dal/db";
import { sports } from "@/dal/db/schemas/sports";
import { eq } from "drizzle-orm";
import { RequestWithContext } from "@/api/types";
import { requireGlobalRole } from "@/utils/rbac";
import AppError from "@/utils/error";

const s = initServer();

export const sportsController = s.router(contract.sports, {
    getSports: async () => {
        const data = await db.select().from(sports);
        
        return {
            status: 200,
            body: data as any,
        };
    },
    getSport: async ({ params }) => {
        const [sport] = await db.select().from(sports).where(eq(sports.id, params.id));
        
        if (!sport) throw new AppError(404, "Sport not found");

        return {
            status: 200,
            body: sport as any,
        };
    },
    create: async ({ body, req }: any) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        await requireGlobalRole(userId, ["admin"]);

        // Double check for duplicate name
        const existing = await db.query.sports.findFirst({
            where: eq(sports.name, body.name),
        });

        if (existing) throw new AppError(409, "A sport with this name already exists");

        const [newSport] = await db
            .insert(sports)
            .values({
                ...body,
                tournamentConfigSchema: body.tournamentConfigSchema || {},
                matchConfigSchema: body.matchConfigSchema || {},
            })
            .returning();

        return {
            status: 201,
            body: newSport as any,
        };
    },
    update: async ({ params, body, req }: any) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        await requireGlobalRole(userId, ["admin"]);

        const [updated] = await db
            .update(sports)
            .set({
                ...body,
                updatedAt: new Date(),
            })
            .where(eq(sports.id, params.id))
            .returning();

        if (!updated) throw new AppError(404, "Sport not found");

        return {
            status: 200,
            body: updated as any,
        };
    },
    delete: async ({ params, req }: any) => {
        const contextReq = req as unknown as RequestWithContext;
        const userId = contextReq.ctx?.decodedToken?.id;
        if (!userId) throw new AppError(401, "Unauthorized");

        await requireGlobalRole(userId, ["admin"]);

        const result = await db
            .delete(sports)
            .where(eq(sports.id, params.id))
            .returning();

        if (result.length === 0) throw new AppError(404, "Sport not found");

        return {
            status: 204,
            body: undefined,
        };
    },
});
