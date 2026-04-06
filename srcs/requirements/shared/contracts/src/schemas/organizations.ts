import { z } from "zod";

export const OrganizationSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(3).max(100),
    slug: z.string().min(3).max(120),
    description: z.string().trim().max(500).nullish(),
    logoUrl: z.string().trim().url().max(2048).nullish(),
    
    visibility: z.enum(["public", "private"]).default("public"),
    
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    deletedAt: z.coerce.date().nullish(),
});

export const CreateOrganizationSchema = z.object({
    name: z.string().trim().min(3).max(100),
    slug: z.string()
        .min(3)
        .max(120)
        .transform((s) => s.trim().toLowerCase())
        .refine((s) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s), {
            message: "Invalid slug format: must be lowercase alphanumeric and can contain internal hyphens.",
        }),
    description: z.string().trim().max(500).optional(),
    logoUrl: z.string().trim().url().max(2048).optional(),
    visibility: z.enum(["public", "private"]).default("public").optional(),
});

export const UpdateOrganizationSchema = CreateOrganizationSchema.partial();

export type Organization = z.infer<typeof OrganizationSchema>;
export type CreateOrganization = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganization = z.infer<typeof UpdateOrganizationSchema>;
