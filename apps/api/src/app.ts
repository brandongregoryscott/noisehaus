import type { Request, Response } from "express";
import type { Logger } from "pino";
import bodyParser from "body-parser";
import {
    MAX_FILE_COUNT_PER_UPLOAD,
    DELETE_BOARD_FILE_ROUTE,
    LIST_BOARD_FILE_ROUTE,
    UPDATE_BOARD_FILE_ROUTE,
    CREATE_BOARD_FILE_ROUTE,
    GET_BOARD_ROUTE,
    LIST_BOARD_ROUTE,
    CREATE_BOARD_ROUTE,
    UPDATE_BOARD_ROUTE,
    DELETE_BOARD_ROUTE,
    GET_BOARD_FILE_ROUTE,
    CREATE_FEEDBACK_ROUTE,
} from "common";
import cors from "cors";
import crypto from "crypto";
import express from "express";
import { BoardFilesController } from "@/board-files/controller";
import { BoardsController } from "@/boards/controller";
import { errorHandler } from "@/error-handler";
import { FeedbackController } from "@/feedback/controller";
import { PocketBaseClient } from "@/pocketbase-client";
import { logger } from "@/utilities/logger";
import { multer } from "@/utilities/multer";
import { createRateLimiter, readRateLimiter } from "@/utilities/rate-limiter";

declare global {
    namespace Express {
        // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
        interface Request {
            logger: Logger;
        }
    }
}

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.use((request: Request, response: Response, next) => {
    const start = Date.now();
    const requestId = crypto.randomUUID().slice(0, 8);
    request.logger = logger.child({ requestId });

    response.on("finish", () => {
        request.logger.info({
            method: request.method,
            path: request.originalUrl,
            responseTime: Date.now() - start,
            statusCode: response.statusCode,
        });
    });

    next();
});

app.get(
    "/healthcheck",
    async (_request: Request, response: Response): Promise<Response> => {
        await PocketBaseClient.healthcheck();
        return response.json("✅");
    }
);

app.delete(DELETE_BOARD_ROUTE, BoardsController.delete);
app.put(UPDATE_BOARD_ROUTE, BoardsController.update);
app.post(CREATE_BOARD_ROUTE, createRateLimiter, BoardsController.create);
app.get(LIST_BOARD_ROUTE, BoardsController.list);
app.get(GET_BOARD_ROUTE, BoardsController.get);

app.get(GET_BOARD_FILE_ROUTE, BoardFilesController.get);
app.post(
    CREATE_BOARD_FILE_ROUTE,
    multer.array("files", MAX_FILE_COUNT_PER_UPLOAD),
    BoardFilesController.create
);
app.put(
    UPDATE_BOARD_FILE_ROUTE,
    multer.single("file"),
    BoardFilesController.update
);
app.get(LIST_BOARD_FILE_ROUTE, BoardFilesController.list);
app.delete(DELETE_BOARD_FILE_ROUTE, BoardFilesController.delete);
app.post(CREATE_FEEDBACK_ROUTE, FeedbackController.create);

app.use(errorHandler);
app.use(readRateLimiter);

export { app };
