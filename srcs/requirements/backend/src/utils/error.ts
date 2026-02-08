import { v4 as uuidv4 } from "uuid";

export default class AppError extends Error {
    public readonly status: number;
    public readonly errorId: string;
    public readonly uid?: string;
    public readonly popup?: string;

    constructor(status: number, message: string, uid?: string) {
        super(message);
        this.status = status;
        this.errorId = uuidv4();
        this.uid = uid;


        Object.setPrototypeOf(this, AppError.prototype);
    }
}
