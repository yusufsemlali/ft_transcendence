import { faker } from '../faker';
import { users } from '@/dal/db/schemas/users';

type UserInsert = typeof users.$inferInsert;

export function makeUserInsert(overrides: Partial<UserInsert> = {}): UserInsert {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = faker.internet
        .username({ firstName, lastName })
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .slice(0, 24)
        .padEnd(3, faker.string.alphanumeric(3));

    return {
        username,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        password: null,
        role: 'user',
        status: 'active',
        displayName: faker.person.fullName({ firstName, lastName }),
        bio: faker.lorem.sentence(),
        tagline: faker.lorem.words(3),
        avatar: faker.image.avatar(),
        banner: null,
        xp: faker.number.int({ min: 0, max: 50000 }),
        level: faker.number.int({ min: 1, max: 100 }),
        eloRating: faker.number.int({ min: 600, max: 2400 }),
        rankTier: faker.helpers.arrayElement(['Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master']),
        isOnline: faker.datatype.boolean({ probability: 0.3 }),
        preferredLanguage: faker.helpers.arrayElement(['en', 'fr', 'ar', 'es', 'de']),
        theme: 'dark',
        metadata: {},
        ...overrides,
    };
}

export function makeUserInserts(count: number, overrides: Partial<UserInsert> = {}): UserInsert[] {
    const seen = new Set<string>();
    const results: UserInsert[] = [];

    for (let i = 0; i < count; i++) {
        let user = makeUserInsert(overrides);
        while (seen.has(user.username) || seen.has(user.email)) {
            user = makeUserInsert(overrides);
        }
        seen.add(user.username);
        seen.add(user.email);
        results.push(user);
    }
    return results;
}

export function makeAdmin(overrides: Partial<UserInsert> = {}): UserInsert {
    return makeUserInsert({ role: 'admin', ...overrides });
}

export function makeOrganizer(overrides: Partial<UserInsert> = {}): UserInsert {
    return makeUserInsert({ role: 'organizer', ...overrides });
}
