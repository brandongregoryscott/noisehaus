import type {
    CreateBoardRequest,
    DeleteBoardRequest,
    GetBoardRequest,
    ListBoardsRequest,
    UpdateBoardRequest,
} from "common";
import type { Request, Response } from "express";
import { BoardsService } from "@/boards/boards-service";
import { sendResultResponse } from "@/error-handler";

const BoardsController = {
    create: async (
        request: CreateBoardRequest & Request,
        response: Response
    ): Promise<Response> => {
        const { body } = request;
        const result = await BoardsService.insert(body);
        return sendResultResponse(result, request, response, 201);
    },
    delete: async (
        request: DeleteBoardRequest & Request,
        response: Response
    ): Promise<Response> => {
        const { body } = request;
        const { slug } = request.params;
        const { token } = body;
        const data = await BoardsService.delete(slug, token);

        return sendResultResponse(data, request, response);
    },
    get: async (
        request: GetBoardRequest & Request,
        response: Response
    ): Promise<Response> => {
        const { slug } = request.params;
        const token = request.query.token;
        const board = await BoardsService.get(slug, token);

        return sendResultResponse(board, request, response);
    },
    list: async (
        request: ListBoardsRequest & Request,
        response: Response
    ): Promise<Response> => {
        const boards = await BoardsService.getAllPublic();

        return sendResultResponse(boards, request, response);
    },
    update: async (
        request: Request & UpdateBoardRequest,
        response: Response
    ): Promise<Response> => {
        const { body } = request;
        const { slug: originalSlug } = request.params;
        const { token, ...input } = body;
        const board = await BoardsService.update({
            originalSlug,
            token,
            ...input,
        });

        return sendResultResponse(board, request, response);
    },
};

export { BoardsController };
