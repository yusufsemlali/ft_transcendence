import type { NextFunction, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import AppError, { getErrorMessage } from "../utils/error";
import { incrementBadAuth } from "./rate-limit";
import { ExpressRequestWithContext } from "../api/types";

type ErrorData = {
  errorId?: string;
  uid?: string;
};

async function errorHandlingMiddleware(
  error: Error,
  expressReq: any,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const req = expressReq as ExpressRequestWithContext;
  try {
    const appError = error as AppError;
    let status = 500;
    
    // Extract ID and uid, either from error or context token
    const data: ErrorData = {
      errorId: appError.errorId ?? uuidv4(),
      uid: appError.uid ?? req.ctx?.decodedToken?.id,
    };
    
    let message = "Unknown error";

    if (/ECONNREFUSED/i.test(error.message)) {
      message = "Could not connect to the database. It may be down.";
    } else if (error instanceof URIError || error instanceof SyntaxError) {
      status = 400;
      message = "Unprocessable request";
    } else if (error instanceof AppError) {
      message = error.message;
      status = error.status;
    } else {
      // For random unhandled errors
      message = `Something went wrong. Please try again later. - ${data.errorId}`;
    }

    // Increment rate limit penalties for failed authentications
    if (status === 401 || status === 403) {
      await incrementBadAuth(req, status);
    }

    // Console logging for debugging (replace complex logger/DB setups)
    if (status >= 500) {
      console.error(`[Server Error ${status}]: ${error.message}`, error.stack);
    } else {
      console.warn(`[Client Error ${status}]: ${error.message}`);
    }

    // Hide errorId from client for generic client-side errors
    if (status < 500) {
      delete data.errorId;
    }

    handleErrorResponse(res, status, message, data);
    return;
  } catch (e) {
    console.error("Error handling middleware failed.");
    console.error(getErrorMessage(e) ?? "Unknown error", e);
  }

  handleErrorResponse(
    res,
    500,
    "Something went really wrong, please contact support.",
  );
}

function handleErrorResponse(
  res: Response,
  status: number,
  message: string,
  data?: ErrorData,
): void {
  res.status(status);
  res.json({ message, data: data ?? null });
}

export default errorHandlingMiddleware;
