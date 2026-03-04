import type { Board, BoardToken } from "../entities";
import type { ApiSuccessResponse } from "../responses";

type CreateBoardOptions = Pick<Board, "name" | "slug">;

type CreateBoardRequest = {
    body: CreateBoardOptions;
};

type CreateBoardResult = Board & Pick<BoardToken, "token">;

type CreateBoardResponse = ApiSuccessResponse<CreateBoardResult>;

type DeleteBoardOptions = Pick<BoardToken, "token">;

type DeleteBoardRequest = {
    body: DeleteBoardOptions;
    params: Pick<Board, "slug">;
};

type DeleteBoardResponse = ApiSuccessResponse<true>;

type GetBoardRequest = {
    params: Pick<Board, "slug">;
    query: Partial<Pick<BoardToken, "token">>;
};

type GetBoardResponse = ApiSuccessResponse<Board>;

type ListBoardsRequest = {};

type ListBoardsResponse = ApiSuccessResponse<Board[]>;

type UpdateBoardRequest = {
    body: UpdateBoardOptions;
    params: Pick<Board, "slug">;
};

type UpdateBoardOptions = Partial<
    Pick<Board, "name" | "slug" | "view_permission">
> &
    Pick<BoardToken, "token">;

type UpdateBoardResponse = ApiSuccessResponse<Board>;

export type {
    CreateBoardOptions,
    CreateBoardRequest,
    CreateBoardResponse,
    CreateBoardResult,
    DeleteBoardOptions,
    DeleteBoardRequest,
    DeleteBoardResponse,
    GetBoardRequest,
    GetBoardResponse,
    ListBoardsRequest,
    ListBoardsResponse,
    UpdateBoardOptions,
    UpdateBoardRequest,
    UpdateBoardResponse,
};
