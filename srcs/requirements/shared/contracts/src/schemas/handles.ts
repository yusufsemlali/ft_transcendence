import { z } from "zod";

export const HandleSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    sportId: z.string().uuid(),
    handle: z.string().min(1),
    metadata: z.record(z.any()), // JSONB
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

export type Handle = z.infer<typeof HandleSchema>;

// Request Schemas
export const CreateHandleSchema = z.object({
    sportId: z.string().uuid(),
    handle: z.string().min(1, "Handle is required"),
    metadata: z.record(z.any()).optional(),
});
export type CreateHandle = z.infer<typeof CreateHandleSchema>;

export const UpdateHandleSchema = z.object({
    handle: z.string().optional(),
    metadata: z.record(z.any()).optional(),
});
export type UpdateHandle = z.infer<typeof UpdateHandleSchema>;

// Linked Accounts (Social/Auth)
export const LinkedAccountSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    provider: z.string(),
    providerId: z.string(),
    accountMetadata: z.string().nullable(),
    lastLoadedAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
});

export type LinkedAccount = z.infer<typeof LinkedAccountSchema>;
