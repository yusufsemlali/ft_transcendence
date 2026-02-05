import { NextFunction, Request, Response } from "express";
import AppError from "../utils/error";
import { v4 as uuidv4 } from "uuid";

interface ErrorResponse {
    message: string;
    data: {
        errorId?: string;
        uid?: string;
    } | null;
}

const errorHandlingMiddleware = (
    error: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    let status = 500;
    let message = "An unexpected error occurred in the tournament system. Please try again later.";

    const errorId = (error as AppError).errorId || uuidv4();
    const uid = (error as AppError).uid;

    if (error instanceof AppError) {
        status = error.status;
        message = error.message;
    } else if (error instanceof SyntaxError) {
        status = 400;
        message = "Unprocessable request (Syntax Error)";
    }

    // In production, we don't leak the exact error message for 500s unless it's a known AppError
    if (status === 500 && process.env.NODE_ENV === "production") {
        message = `System Error Reference: ${errorId}`;
    }

    console.error(`[${status}] ${errorId} - ${error.message}`);
    if (process.env.NODE_ENV === "development") {
        console.error(error.stack);
    }

    const response: ErrorResponse = {
        message,
        data: {
            errorId: status >= 500 ? errorId : undefined,
            uid
        }
    };

    res.status(status).json(response);
};

export default errorHandlingMiddleware;
