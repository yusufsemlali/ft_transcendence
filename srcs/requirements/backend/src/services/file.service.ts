import fs from "fs/promises";
import path from "path";
import { eq, and } from "drizzle-orm";
import { db } from "../dal/db";
import { files } from "../dal/db/schemas/files";
import AppError from "../utils/error";

export class FileService {
    static async saveFileRecord(uploaderId: string, file: Express.Multer.File) {
        // Construct the public URL path for serving via express.static
        const fileUrl = `${process.env.APP_URL || "http://localhost:3000"}/uploads/${file.filename}`;
        
        const [insertedFile] = await db.insert(files).values({
            uploaderId: uploaderId,
            originalName: file.originalname,
            savedName: file.filename,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            url: fileUrl,
            visibility: 'public'
        }).returning();

        return insertedFile;
    }

    static async deleteFileRecord(uploaderId: string, fileId: string) {
        // 1. Ensure the file belongs to the user
        const [file] = await db.select().from(files).where(
            and(eq(files.id, fileId), eq(files.uploaderId, uploaderId))
        );

        if (!file) {
            throw new AppError(404, "File not found or access denied");
        }

        // 2. Delete the record from the database
        await db.delete(files).where(eq(files.id, fileId));

        // 3. Purge the actual binary from the file system
        const filePath = path.join(process.cwd(), 'uploads', file.savedName);
        try {
            await fs.unlink(filePath);
        } catch (error: any) {
            console.error(`[FileService] Failed to unlink file from disk: ${filePath}`, error);
            // We ignore ENOENT (already deleted on disk) to keep DB and disk eventually consistent
            if (error.code !== 'ENOENT') {
                throw new AppError(500, "Failed to remove file from storage system");
            }
        }

        return { success: true };
    }
}
