import type { Request, Response } from "express";
import bodyParser from "body-parser";
import {
    MAX_FILE_COUNT_PER_UPLOAD,
    DELETE_BOARD_FILE_ROUTE,
    LIST_BOARD_FILE_ROUTE,
    GET_BOARD_FILE_SIZE_ROUTE,
    UPDATE_BOARD_FILE_ROUTE,
    CREATE_BOARD_FILE_ROUTE,
    GET_BOARD_ROUTE,
    LIST_BOARD_ROUTE,
    CREATE_BOARD_ROUTE,
    UPDATE_BOARD_ROUTE,
    DELETE_BOARD_ROUTE,
    GET_BOARD_FILE_ROUTE,
} from "common";
import cors from "cors";
import express from "express";
import { BoardFilesController } from "./board-files/controller";
import { BoardsController } from "./boards/controller";
import { BoardsStore } from "./boards/store";
import { errorHandler } from "./error-handler";
import { multer } from "./utilities/multer";
import { createRateLimiter, readRateLimiter } from "./utilities/rate-limiter";

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get(
    "/healthcheck",
    async (_request: Request, response: Response): Promise<Response> => {
        // We're pinging Supabase to keep the project online
        await BoardsStore.table().select("*", { count: "estimated" });
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
app.get(GET_BOARD_FILE_SIZE_ROUTE, BoardFilesController.size);

app.use(errorHandler);
app.use(readRateLimiter);

export { app };
