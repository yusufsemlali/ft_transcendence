import { db } from "@/dal/db";
import { tournaments } from "@/dal/db/schemas/tournaments";
import { tournamentRegistrations } from "@/dal/db/schemas/tournament_registrations";
import { CreateTournament } from "@ft-transcendence/contracts";
import { and, eq } from "drizzle-orm";
import AppError from "@/utils/error";

export const createTournament = async (data: CreateTournament & { organizerId: string }) => {
    const slug = data.name.toLowerCase().replace(/ /g, '-');

    const [newTournament] = await db.insert(tournaments).values({
        ...data,
        slug,
        status: 'draft',
    }).returning();

    return newTournament;
};

export const joinTournament = async ({ tournamentId, userId }: { tournamentId: number; userId: string }) => {
    const [tournament] = await db
        .select({
            maxParticipants: tournaments.maxParticipants,
        })
        .from(tournaments)
        .where(eq(tournaments.id, tournamentId));

    if (!tournament) {
        throw new AppError(400, "Tournament not found");
    }

    const [existingRegistration] = await db
        .select({ id: tournamentRegistrations.id })
        .from(tournamentRegistrations)
        .where(and(
            eq(tournamentRegistrations.tournamentId, tournamentId),
            eq(tournamentRegistrations.userId, userId)
        ));

    if (existingRegistration) {
        throw new AppError(409, "You already joined this tournament");
    }

    const currentRegistrations = await db
        .select({ id: tournamentRegistrations.id })
        .from(tournamentRegistrations)
        .where(eq(tournamentRegistrations.tournamentId, tournamentId));

    if (currentRegistrations.length >= tournament.maxParticipants) {
        throw new AppError(409, "Tournament is full");
    }

    let registration;
    try {
        [registration] = await db.insert(tournamentRegistrations).values({
            tournamentId,
            userId,
        }).returning();
    } catch (error: any) {
        if (error?.code === "23505") {
            throw new AppError(409, "You already joined this tournament");
        }

        throw error;
    }

    return registration;
};
