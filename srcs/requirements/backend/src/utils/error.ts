import { v4 as uuidv4 } from "uuid";

export default class AppError extends Error {
    public readonly status: number;
    public readonly errorId: string;
    public readonly uid?: string;

    constructor(status: number, message: string, uid?: string) {
        super(message);
        this.status = status;
        this.errorId = uuidv4();
        this.uid = uid;

        // Ensure the name is AppError
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    return String(error);
}
