import type { NextFunction, Request, Response } from "express";
import { HttpResponse } from "@/utilities/responses";

const errorHandler = (
    cause: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction
) => HttpResponse.error(response, cause);

export { errorHandler };
