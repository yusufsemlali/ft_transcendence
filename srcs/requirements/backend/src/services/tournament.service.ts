import { db } from "@/dal/db";
import { tournaments } from "@/dal/db/schemas/tournaments";
import { CreateTournament } from "@ft-transcendence/contracts";
import { ApiResponse } from "@/utils/response";

export const createTournament = async (data: CreateTournament & { organizerId: string }) => {
    const slug = data.name.toLowerCase().replace(/ /g, '-');

    const [newTournament] = await db.insert(tournaments).values({
        ...data,
        slug,
        status: 'draft',
    }).returning();

    return new ApiResponse("Tournament created successfully", newTournament);
};