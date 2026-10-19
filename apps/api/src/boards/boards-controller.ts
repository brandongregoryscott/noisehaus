import type {
    CreateBoardRequest,
    DeleteBoardRequest,
    GetBoardRequest,
    ListBoardsRequest,
    UpdateBoardRequest,
} from "common";
import type { Response as ExpressResponse } from "express";
import { BoardsService } from "@/boards/boards-service";
import { Response } from "@/utilities/responses";

const BoardsController = {
    create: async (
        request: CreateBoardRequest,
        response: ExpressResponse
    ): Promise<ExpressResponse> => {
        const { body } = request;
        const result = await BoardsService.insert(body);
        return Response.created(response, result);
    },
    delete: async (
        request: DeleteBoardRequest,
        response: ExpressResponse
    ): Promise<ExpressResponse> => {
        const { body } = request;
        const { slug } = request.params;
        const { token } = body;
        const deleteResult = await BoardsService.delete(slug, token);

        return Response.ok(response, deleteResult);
    },
    get: async (
        request: GetBoardRequest,
        response: ExpressResponse
    ): Promise<ExpressResponse> => {
        const { slug } = request.params;
        const token = request.query.token;
        const boardResult = await BoardsService.get(slug, token);

        return Response.ok(response, boardResult);
    },
    list: async (
        _request: ListBoardsRequest,
        response: ExpressResponse
    ): Promise<ExpressResponse> => {
        const boardsResult = await BoardsService.getAllPublic();

        return Response.ok(response, boardsResult);
    },
    update: async (
        request: UpdateBoardRequest,
        response: ExpressResponse
    ): Promise<ExpressResponse> => {
        const { body } = request;
        const { slug: originalSlug } = request.params;
        const { token, ...input } = body;
        const boardResult = await BoardsService.update({
            originalSlug,
            token,
            ...input,
        });

        return Response.ok(response, boardResult);
    },
};

export { BoardsController };
