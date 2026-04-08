import fs from "fs/promises";
import { createReadStream } from "fs";
import crypto from "crypto";
import path from "path";
import { eq, and } from "drizzle-orm";
import { db } from "../dal/db";
import { files } from "../dal/db/schemas/files";
import AppError from "../utils/error";

export class FileService {
    private static async calculateHash(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = createReadStream(filePath);
            stream.on('data', data => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', err => reject(err));
        });
    }

    static async saveFileRecord(uploaderId: string, file: Express.Multer.File) {
        const filePath = file.path; // Absolute path from Multer (e.g. /app/uploads/...)
        const hash = await this.calculateHash(filePath);

        // Check for duplicate content from the same user
        const [existing] = await db.select().from(files).where(
            and(eq(files.contentHash, hash), eq(files.uploaderId, uploaderId))
        );

        if (existing) {
            // Content already exists for this user — delete the new physical file and return existing record
            try { await fs.unlink(filePath); } catch {}
            return existing;
        }

        // Public URL must match app.ts static mount: app.use("/api/uploads", ...)
        const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api").replace(/\/$/, "");
        const fileUrl = `${apiBase}/uploads/${file.filename}`;
        
        const [insertedFile] = await db.insert(files).values({
            uploaderId: uploaderId,
            originalName: file.originalname,
            savedName: file.filename,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            contentHash: hash,
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
        const filePath = path.join('/app/uploads', file.savedName);
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
