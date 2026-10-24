import type {
    CreateBoardRequest,
    DeleteBoardRequest,
    GetBoardRequest,
    ListBoardsRequest,
    UpdateBoardRequest,
} from "common";
import type { Response } from "express";
import { BoardsService } from "@/boards/boards-service";
import { HttpResponse } from "@/utilities/responses";

const BoardsController = {
    create: async (
        request: CreateBoardRequest,
        response: Response
    ): Promise<Response> => {
        const { body } = request;
        const result = await BoardsService.insert(body).toPromise();
        return HttpResponse.created(response, result);
    },
    delete: async (
        request: DeleteBoardRequest,
        response: Response
    ): Promise<Response> => {
        const { body } = request;
        const { slug } = request.params;
        const { token } = body;
        const deleteResult = await BoardsService.delete(
            slug,
            token
        ).toPromise();

        return HttpResponse.ok(response, deleteResult);
    },
    get: async (
        request: GetBoardRequest,
        response: Response
    ): Promise<Response> => {
        const { slug } = request.params;
        const token = request.query.token;
        const boardResult = await BoardsService.get(slug, token).toPromise();

        return HttpResponse.ok(response, boardResult);
    },
    list: async (
        _request: ListBoardsRequest,
        response: Response
    ): Promise<Response> => {
        const boardsResult = await BoardsService.getAllPublic().toPromise();

        return HttpResponse.ok(response, boardsResult);
    },
    update: async (
        request: UpdateBoardRequest,
        response: Response
    ): Promise<Response> => {
        const { body } = request;
        const { slug: originalSlug } = request.params;
        const { token, ...input } = body;
        const boardResult = await BoardsService.update({
            originalSlug,
            token,
            ...input,
        }).toPromise();

        return HttpResponse.ok(response, boardResult);
    },
};

export { BoardsController };
