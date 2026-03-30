import { Request } from "express";

export type DecodedToken = {
  type: "Bearer" | "None";
  id: string;
  sessionId: string;
  username: string;
  role: string;
};

export interface AppContext {
  decodedToken: DecodedToken;
  requestId: string;
  configuration: any; // replace with your actual configuration type
}

export interface ExpressRequestWithContext extends Request {
  ctx: AppContext;
}

export type RequestWithContext = ExpressRequestWithContext;
