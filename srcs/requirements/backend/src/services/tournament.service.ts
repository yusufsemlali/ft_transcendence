import { db } from "@/dal/db";
import { tournaments } from "@/dal/db/schemas/tournaments";
import { sports } from "@/dal/db/schemas/sports";
import { organizationMembers } from "@/dal/db/schemas/organizations";
import AppError from "@/utils/error";
import { 
    CreateTournament, 
    UpdateTournament, 
    UpdateTournamentSchema,
    PublicTournamentSchema 
} from "@ft-transcendence/contracts";
import { eq, and, or, sql, desc, ilike } from "drizzle-orm";
import { generateUniqueSlug } from "@/utils/slug";
import { TournamentPolicy } from "@/policies/tournament.policy";
import * as LobbyService from "@/services/lobby.service";

export const createTournament = async (organizationId: string, data: Omit<CreateTournament, 'organizationId'>) => {
    const [sportBlueprint] = await db
        .select()
        .from(sports)
        .where(eq(sports.id, data.sportId));

    if (!sportBlueprint) {
        throw new AppError(404, `The selected sport blueprint (ID: "${data.sportId}") does not exist.`);
    }

    const slug = generateUniqueSlug(data.name, organizationId);

    try {
        const [newTournament] = await db.insert(tournaments).values({
            organizationId,
            sportId: data.sportId,
            name: data.name,
            slug,
            description: data.description,
            scoringType: sportBlueprint.scoringType,
            matchConfigSchema: sportBlueprint.matchConfigSchema,
            mode: data.mode,
            minTeamSize: data.minTeamSize,
            maxTeamSize: data.maxTeamSize,
            allowDraws: data.allowDraws,
            requiredHandleType: data.requiredHandleType,
            minParticipants: data.minParticipants,
            maxParticipants: data.maxParticipants,
            prizePool: data.prizePool,
            entryFee: data.entryFee,
            bannerUrl: data.bannerUrl,
            status: 'draft',
            bracketType: data.bracketType,
            isPrivate: data.isPrivate ?? false,
            customSettings: data.customSettings || {},
        }).returning();

        return { data: newTournament };
    } catch (error: any) {
        const errorCode = error.code || error.cause?.code;
        const constraintName = error.constraint || error.cause?.constraint || "";

        if (errorCode === '23505' && (constraintName.includes('slug') || error.message.includes('slug'))) {
            throw new AppError(409, "A tournament with a similar name already exists in your organization.");
        }

        if (errorCode === '23503') {
            if (constraintName.includes('organization_id')) {
                throw new AppError(404, "Target Organization not found.");
            }
        }
        throw error;
    }
};

export const updateTournament = async (id: string, data: any) => {
    const validatedData = UpdateTournamentSchema.parse(data);

    const [current] = await db
        .select()
        .from(tournaments)
        .where(eq(tournaments.id, id));

    if (!current) throw new AppError(404, "Tournament not found");

    TournamentPolicy.enforceUpdateRules(current.status, validatedData);
    
    // TODO: Real registration count
    const mockRegistrationCount = 0; 
    TournamentPolicy.enforceCapacityRules(validatedData.maxParticipants, mockRegistrationCount);

    try {
        const [updated] = await db
            .update(tournaments)
            .set({
                ...validatedData,
                updatedAt: new Date(),
            })
            .where(eq(tournaments.id, id))
            .returning();

        // POLICY: If transitioning to 'ongoing', purge the lobby
        if (validatedData.status === 'ongoing' && current.status !== 'ongoing') {
            await LobbyService.purgeLobby(id);
        }

        return { data: updated };
    } catch (error: any) {
        const errorCode = error.code || error.cause?.code;
        if (errorCode === '23505') {
             throw new AppError(409, "A tournament conflict occurred (duplicate name or slug).");
        }
        throw error;
    }
};

export const deleteTournament = async (id: string) => {
    const [current] = await db
        .select()
        .from(tournaments)
        .where(eq(tournaments.id, id));

    if (!current) throw new AppError(404, "Tournament not found");

    const mockRegistrationCount = 0; 
    const strategy = TournamentPolicy.getSafeDeletionStrategy(current.status, mockRegistrationCount);

    if (strategy === 'HARD_DELETE') {
        await db.delete(tournaments).where(eq(tournaments.id, id));
        return { actionTaken: 'HARD_DELETE', message: "Tournament permanently deleted." };
    } 
    
    if (strategy === 'CANCEL') {
        await db
            .update(tournaments)
            .set({ 
                status: 'cancelled',
                updatedAt: new Date() 
            })
            .where(eq(tournaments.id, id));
        return { actionTaken: 'CANCELLED', message: "Tournament cancelled to preserve participant data." };
    }
};

export const getTournamentById = async (id: string) => {
    const [tournament] = await db
        .select()
        .from(tournaments)
        .where(eq(tournaments.id, id));

    if (!tournament) throw new AppError(404, "Tournament not found");

    return { data: tournament };
};

export const isTournamentAdmin = async (userId: string, organizationId: string) => {
    const [membership] = await db
        .select({ role: organizationMembers.role })
        .from(organizationMembers)
        .where(and(eq(organizationMembers.userId, userId), eq(organizationMembers.organizationId, organizationId)));
    
    return membership && (membership.role === 'owner' || membership.role === 'admin');
};

export const discoverTournamentById = async (id: string) => {
    const response = await getTournamentById(id);
    
    if (response.data.isPrivate) {
        throw new AppError(404, "Tournament not found");
    }

    const sanitizedData = PublicTournamentSchema.parse(response.data);
    return { data: sanitizedData };
};

export const listOrgTournaments = async (organizationId: string) => {
    return await db
        .select()
        .from(tournaments)
        .where(eq(tournaments.organizationId, organizationId))
        .orderBy(desc(tournaments.createdAt));
};

export const getTournaments = async (query: { 
    page: number; 
    pageSize: number; 
    search?: string; 
    sportId?: string; 
    status?: string 
}) => {
    const { page, pageSize, search, sportId, status } = query;
    const offset = (page - 1) * pageSize;

    const filters = [];
    filters.push(eq(tournaments.isPrivate, false));

    if (search) {
        filters.push(
            or(
                ilike(tournaments.name, `%${search}%`),
                ilike(tournaments.description, `%${search}%`)
            )
        );
    }
    if (sportId) filters.push(eq(tournaments.sportId, sportId));
    if (status) filters.push(eq(tournaments.status, status as any));

    const whereClause = and(...filters);

    const tournamentList = await db
        .select()
        .from(tournaments)
        .where(whereClause)
        .limit(pageSize)
        .offset(offset)
        .orderBy(desc(tournaments.createdAt));

    const sanitizedTournaments = tournamentList.map(t => PublicTournamentSchema.parse(t));

    const [totalCount] = await db
        .select({ value: sql`count(*)`.mapWith(Number) })
        .from(tournaments)
        .where(whereClause);

    const total = totalCount?.value || 0;

    return {
        tournaments: sanitizedTournaments,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
};

