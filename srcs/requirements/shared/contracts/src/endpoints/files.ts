import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

export const FileSchema = z.object({
    id: z.string().uuid(),
    originalName: z.string(),
    url: z.string(),
    mimeType: z.string(),
    sizeBytes: z.number(),
});

export const filesContract = c.router({
    uploadFile: {
        method: "POST",
        path: "/files/upload",
        contentType: "multipart/form-data",
        body: c.type<{ file: File }>(), // Instructs ts-rest to expect a binary file
        responses: {
            201: z.object({ message: z.string(), data: FileSchema }),
            400: z.object({ message: z.string() }), // File too large, wrong type
            401: z.object({ message: z.string() }),
        },
        summary: "Upload a file (Image or Document)",
    },
    deleteFile: {
        method: "DELETE",
        path: "/files/:id",
        pathParams: z.object({ id: z.string().uuid() }),
        responses: {
            200: z.object({ message: z.string() }),
            403: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
            500: z.object({ message: z.string() }),
        },
        summary: "Delete a previously uploaded file",
    }
});
