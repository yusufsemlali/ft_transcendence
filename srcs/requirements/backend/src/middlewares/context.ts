import { NextFunction, Response, Request } from "express";
import { v4 as uuidv4 } from "uuid";
import { getCachedConfiguration } from "../init/configuration";
import { ExpressRequestWithContext } from "../api/types";

async function contextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const requestId = uuidv4();

  const configuration = await getCachedConfiguration(true);

  const ctx: ExpressRequestWithContext["ctx"] = {
    requestId,
    configuration,
    decodedToken: {
      type: "None",
      id: "",
      sessionId: "",
      username: "",
      role: "",
    },
  };

  (req as ExpressRequestWithContext).ctx = ctx;

  res.setHeader("x-request-id", requestId);

  next();
}

export default contextMiddleware;
