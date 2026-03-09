import type {
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
import type { Response } from "express";
import { ViewPermission } from "common";
import { isEmpty } from "lodash-es";
import { BoardsStore } from "@/boards/store";
import { BOARD_NOT_FOUND_ERROR } from "@/utilities/errors";
import { created, ok } from "@/utilities/responses";

const BoardsController = {
    create: async (
        request: CreateBoardRequest,
        response: Response
    ): Promise<Response<CreateBoardResponse>> => {
        const { body } = request;
        const data = await BoardsStore.insert(body);

        return created(response, data);
    },
    delete: async (
        request: DeleteBoardRequest,
        response: Response
    ): Promise<Response<DeleteBoardResponse>> => {
        const { body } = request;
        const { slug } = request.params;
        const { token } = body;
        const data = await BoardsStore.delete(slug, token);

        return ok(response, data);
    },
    get: async (
        request: GetBoardRequest,
        response: Response
    ): Promise<Response> => {
        const { slug } = request.params;
        const token = request.query.token;
        const board = await BoardsStore.unsafe__getBySlug(slug);
        if (board === null) {
            throw BOARD_NOT_FOUND_ERROR;
        }

        // If the board is not protected by a token, just return it. This way, users can't brute force
        // their way into figuring out a token that could administrate the board
        if (board.view_permission !== ViewPermission.ByToken) {
            return ok(response, board);
        }

        if (isEmpty(token)) {
            throw BOARD_NOT_FOUND_ERROR;
        }

        await BoardsStore.authorizeWritePermissionOrThrow({
            slug,
            token: token!,
        });
        return ok(response, board);
    },
    list: async (
        _request: ListBoardsRequest,
        response: Response
    ): Promise<Response<ListBoardsResponse>> => {
        const boards = await BoardsStore.getAllPublic();

        return ok(response, boards);
    },
    update: async (
        request: UpdateBoardRequest,
        response: Response
    ): Promise<Response<UpdateBoardResponse>> => {
        const { body } = request;
        const { slug: originalSlug } = request.params;
        const { token, ...input } = body;
        const board = await BoardsStore.update({
            originalSlug,
            token,
            ...input,
        });

        return ok(response, board);
    },
};

export { BoardsController };
