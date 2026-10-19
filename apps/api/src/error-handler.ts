import type { NextFunction, Request, Response } from "express";
import { error } from "@/utilities/responses";

const errorHandler = (
    cause: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction
) => error(response, cause);

export { errorHandler };
