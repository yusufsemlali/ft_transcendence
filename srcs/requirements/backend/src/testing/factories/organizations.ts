import { faker } from '../faker';
import { organizations, organizationMembers } from '@/dal/db/schemas/organizations';

type OrgInsert = typeof organizations.$inferInsert;
type OrgMemberInsert = typeof organizationMembers.$inferInsert;

export function makeOrgInsert(overrides: Partial<OrgInsert> = {}): OrgInsert {
    const name = faker.company.name().slice(0, 100);
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 100) + '-' + faker.string.alphanumeric(6);

    return {
        name,
        slug,
        description: faker.company.catchPhrase(),
        logoUrl: null,
        visibility: 'public',
        ...overrides,
    };
}

export function makeOrgMemberInsert(
    organizationId: string,
    userId: string,
    overrides: Partial<OrgMemberInsert> = {},
): OrgMemberInsert {
    return {
        organizationId,
        userId,
        role: 'member',
        ...overrides,
    };
}
