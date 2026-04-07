import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import { uploadMiddleware } from "../../middleware/upload";
import { FileService } from "../../services/file.service";
import AppError from "../../utils/error";

const s = initServer();

export const filesController = s.router(contract.files, {
    uploadFile: {
        middleware: [uploadMiddleware.single("file")], // Injects Multer!
        handler: async ({ req }) => {
            const contextReq = req as any;
            const userId = contextReq.ctx?.decodedToken?.id || contextReq.ctx?.user?.id;
            const file = contextReq.file; // Populated by Multer

            if (!userId) throw new AppError(401, "Authentication required");
            if (!file) throw new AppError(400, "No file uploaded or file rejected by filters");

            const savedFile = await FileService.saveFileRecord(userId, file);

            return {
                status: 201,
                body: {
                    message: "Uploaded successfully",
                    data: {
                        id: savedFile.id,
                        originalName: savedFile.originalName,
                        url: savedFile.url,
                        mimeType: savedFile.mimeType,
                        sizeBytes: savedFile.sizeBytes,
                    },
                },
            };
        }
    },
    deleteFile: {
        handler: async ({ req, params: { id } }) => {
            const contextReq = req as any;
            const userId = contextReq.ctx?.decodedToken?.id || contextReq.ctx?.user?.id;

            if (!userId) throw new AppError(401, "Authentication required");

            await FileService.deleteFileRecord(userId, id);

            return {
                status: 200,
                body: { message: "File deleted successfully" }
            };
        }
    }
});
