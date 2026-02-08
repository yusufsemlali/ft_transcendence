import { Request } from "express";

export type DecodedToken = {
    type: "Bearer" | "None";
    id: string;
    username: string;
    role: string;
};

export interface AppContext {
    decodedToken?: DecodedToken;
    requestId: string;
}

export interface RequestWithContext extends Request {
    ctx: AppContext;
}
