import { z } from "zod";

export const OrganizationSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(3),
    slug: z.string(),
    description: z.string().nullable().optional(),
    logoUrl: z.string().nullable().optional(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

export const CreateOrganizationSchema = z.object({
    name: z.string().min(3).max(100),
    slug: z.string().min(3).max(120).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with dashes"),
    description: z.string().max(500).optional(),
});

export type Organization = z.infer<typeof OrganizationSchema>;
export type CreateOrganization = z.infer<typeof CreateOrganizationSchema>;
