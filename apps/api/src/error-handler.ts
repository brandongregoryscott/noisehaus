import type { NextFunction, Request, Response } from "express";
import { logRequestError } from "@/logging";
import { HttpResponse } from "@/utilities/responses";

const errorHandler = (
    cause: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction
) => {
    if (response.headersSent) {
        logRequestError(response, cause);
        response.destroy();
        return;
    }
    return HttpResponse.error(response, cause);
};

export { errorHandler };
