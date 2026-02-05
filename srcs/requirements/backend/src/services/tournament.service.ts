import { db } from "@/dal/db";
import { tournaments } from "@/dal/db/schemas/tournaments";
import { CreateTournament } from "@ft-transcendence/contracts";

export const createTournament = async (data: CreateTournament & { organizerId: number }) => {
    const slug = data.name.toLowerCase().replace(/ /g, '-');

    const [newTournament] = await db.insert(tournaments).values({
        ...data,
        slug,
        status: 'draft',
    }).returning();

    return newTournament;
};