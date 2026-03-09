import type { Request, Response } from "express";
import { ErrorName } from "common";
import rateLimit from "express-rate-limit";
import { tooManyRequests } from "@/utilities/responses";

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

const createRateLimiter = rateLimit({
    max: 10,
    message: (_request: Request, response: Response) =>
        tooManyRequests(response, {
            message:
                "You've created too many boards in a short period of time. Please try again later.",
            name: ErrorName.ERROR_RATE_LIMIT_EXCEEDED,
        }),
    standardHeaders: true,
    windowMs: ONE_HOUR_IN_MS,
});

const readRateLimiter = rateLimit({
    max: 1000,
    message: (_request: Request, response: Response) =>
        tooManyRequests(response, {
            message:
                "You've sent too many requests in a short period of time. Please try again later.",
            name: ErrorName.ERROR_RATE_LIMIT_EXCEEDED,
        }),
    standardHeaders: true,
    windowMs: ONE_HOUR_IN_MS,
});

export { createRateLimiter, readRateLimiter };
