import type {
    ApiErrorResponse,
    CreateBoardRequest,
    CreateBoardResponse,
    DeleteBoardRequest,
    DeleteBoardResponse,
    GetBoardRequest,
    ListBoardsRequest,
    ListBoardsResponse,
    UpdateBoardRequest,
    UpdateBoardResponse,
} from "common";
import type { Request, Response } from "express";
import { BoardsService } from "@/boards/boards-service";
import { sendErrorResponse } from "@/error-handler";
import { created, ok } from "@/utilities/responses";

const BoardsController = {
    create: async (
        request: CreateBoardRequest & Request,
        response: Response
    ): Promise<Response<ApiErrorResponse> | Response<CreateBoardResponse>> => {
        const { body } = request;
        const result = await BoardsService.insert(body);
        if (result.isErr) {
            return sendErrorResponse(result.error, request, response);
        }

        return created(response, result.value);
    },
    delete: async (
        request: DeleteBoardRequest,
        response: Response
    ): Promise<Response<DeleteBoardResponse>> => {
        const { body } = request;
        const { slug } = request.params;
        const { token } = body;
        const data = await BoardsService.delete(slug, token);

        return ok(response, data);
    },
    get: async (
        request: GetBoardRequest,
        response: Response
    ): Promise<Response> => {
        const { slug } = request.params;
        const token = request.query.token;
        const board = await BoardsService.get(slug, token);

        return ok(response, board);
    },
    list: async (
        _request: ListBoardsRequest,
        response: Response
    ): Promise<Response<ListBoardsResponse>> => {
        const boards = await BoardsService.getAllPublic();

        return ok(response, boards);
    },
    update: async (
        request: UpdateBoardRequest,
        response: Response
    ): Promise<Response<UpdateBoardResponse>> => {
        const { body } = request;
        const { slug: originalSlug } = request.params;
        const { token, ...input } = body;
        const board = await BoardsService.update({
            originalSlug,
            token,
            ...input,
        });

        return ok(response, board);
    },
};

export { BoardsController };
