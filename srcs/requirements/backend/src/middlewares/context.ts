import { NextFunction, Response } from "express";
import { v4 as uuidv4 } from "uuid";



const contextMiddleware = (
    req: any,
    res: Response,
    next: NextFunction
): void => {
    const requestId = uuidv4();

    req.ctx = {
        requestId: requestId,
    };

    res.setHeader("x-request-id", requestId);

    next();
};

export default contextMiddleware;
