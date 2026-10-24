import type { Request, Response } from "express";
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
import express from "express";
import { BoardFilesController } from "@/board-files/board-files-controller";
import { BoardsController } from "@/boards/boards-controller";
import { errorHandler } from "@/error-handler";
import { FeedbackController } from "@/feedback/feedback-controller";
import { requestLogging } from "@/logging";
import { createMetrics } from "@/metrics";
import { PocketBaseClient } from "@/pocketbase-client";
import { multer } from "@/utilities/multer";
import { createRateLimiter, readRateLimiter } from "@/utilities/rate-limiter";

const app = express();
const metrics = createMetrics();

app.use(requestLogging());
app.use(metrics.middleware);
app.use(express.json(), (request, _response, next) => {
    // Existing handlers expect the old parser's empty object for unparsed bodies.
    request.body ??= {};
    next();
});
app.use(cors());

app.get(
    "/health",
    async (request: Request, response: Response): Promise<Response> => {
        try {
            await PocketBaseClient.healthcheck();
            return response.json({ ok: true });
        } catch (error) {
            request.logger.error(
                { err: error, event: "health-check-failed" },
                "health check failed"
            );
            return response.status(503).json({ ok: false });
        }
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

export { app, metrics };
