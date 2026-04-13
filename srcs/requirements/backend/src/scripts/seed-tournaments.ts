import { db } from "@/dal/db";
import { tournaments } from "@/dal/db/schemas/tournaments";

// The IDs you provided
const ORG_ID = "cae3ef06-17aa-485a-ae54-4287f67bb0a3";
const SPORT_ID = "3e8817dd-6763-4c1b-9cd4-a556baef117d";

const adjectives = ["Winter", "Summer", "Global", "Local", "Elite", "Amateur", "UM6P", "Pro", "Charity", "Weekly"];
const nouns = ["Championship", "Classic", "Showdown", "Cup", "League", "Invitational", "Brawl", "Series"];
const games = ["Valorant", "League of Legends", "Basketball", "Chess", "CS2", "FIFA"];

const getRandom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

async function seed() {
    console.log("🌱 Generating 1000 tournaments...");
    const payload: (typeof tournaments.$inferInsert)[] = [];

    for (let i = 0; i < 1000; i++) {
        const name = `${getRandom(adjectives)} ${getRandom(games)} ${getRandom(nouns)} ${i}`;
        // Manually creating a slug since we are bypassing the service layer
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-${Math.random().toString(36).substring(7)}`;

        payload.push({
            organizationId: ORG_ID,
            sportId: SPORT_ID,
            name: name,
            slug: slug,
            description: `This is the ${name}. Come join us for a great time!`,
            scoringType: "points_high", // Default
            matchConfigSchema: {},
            mode: "1v1" as const,
            minTeamSize: 1,
            maxTeamSize: 1,
            allowDraws: true,
            requiredHandleType: "riot_id",
            minParticipants: 2,
            lobbyCapacity: Math.floor(Math.random() * 100) + 2, // Random capacity
            status: "draft" as const,
            bracketType: "single_elimination" as const,
            isPrivate: Math.random() > 0.9, // Make ~10% of them private to test your privacy filter!
            customSettings: {},
        });
    }

    console.log("🚀 Pushing to database in chunks...");

    // PostgreSQL limits the number of parameters in a single query. 
    // Chunking by 500 ensures Drizzle doesn't crash.
    const chunkSize = 500;
    for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        await db.insert(tournaments).values(chunk);
        console.log(`✅ Inserted chunk ${i / chunkSize + 1}`);
    }

    console.log("🎉 Seeding complete! Go test your search API.");
    process.exit(0);
}

seed().catch(console.error);
