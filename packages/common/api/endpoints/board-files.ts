import type {
    Board,
    BoardFile,
    BoardToken,
    PresignedBoardFile,
} from "../entities";
import type { ApiSuccessResponse } from "../responses";
import type { UpdateBoardOptions, DeleteBoardOptions } from "./boards";

type ListBoardFilesRequest = {
    params: Pick<Board, "slug">;
    query: Partial<Pick<BoardToken, "token">>;
};

type ListBoardFilesResponse = ApiSuccessResponse<PresignedBoardFile[]>;

type UpdateBoardFileRequest = {
    body: UpdateBoardOptions;
    params: Pick<Board, "slug"> & Pick<BoardFile, "id">;
};

type UpdateBoardFileOptions = {
    displayName?: string;
    file?: File;
} & Pick<BoardFile, "emoji"> &
    Pick<BoardToken, "token">;

type UpdateBoardFileResponse = ApiSuccessResponse<BoardFile>;

type DeleteBoardFileOptions = Pick<BoardToken, "token">;

type DeleteBoardFileRequest = {
    body: DeleteBoardOptions;
    params: Pick<Board, "slug"> & Pick<BoardFile, "id">;
};

type DeleteBoardFileResponse = ApiSuccessResponse<true>;

export type {
    DeleteBoardFileOptions,
    DeleteBoardFileRequest,
    DeleteBoardFileResponse,
    ListBoardFilesRequest,
    ListBoardFilesResponse,
    UpdateBoardFileOptions,
    UpdateBoardFileRequest,
    UpdateBoardFileResponse,
};
