import multer from "multer";
import path from "path";
import crypto from "crypto";
import AppError from "../utils/error";

// Configure local storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/app/uploads'); // Point to the mapped volume
    },
    filename: (req, file, cb) => {
        // Create a secure, random filename to prevent collisions and path traversal
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

// File Validation (Only images and PDFs)
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError(400, "Invalid file type. Only JPG, PNG, WEBP, GIF, and PDF are allowed."), false);
    }
};

export const uploadMiddleware = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
