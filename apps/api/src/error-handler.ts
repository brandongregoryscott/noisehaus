import type {
    NextFunction,
    Request,
    Response as ExpressResponse,
} from "express";
import { Response } from "@/utilities/responses";

const errorHandler = (
    cause: unknown,
    _request: Request,
    response: ExpressResponse,
    _next: NextFunction
) => Response.error(response, cause);

export { errorHandler };
