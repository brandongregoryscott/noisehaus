import type { ViewPermission } from "../enums";

type Board = {
    createdAt: string;
    id: string;
    name: string;
    slug: string;
    updatedAt: string;
    viewPermission: ViewPermission | string;
};

type BoardFile = {
    boardId: string;
    createdAt: string;
    displayName: string;
    emoji: null | string;
    id: string;
    position: null | number;
    size: number;
    updatedAt: string;
};

type PresignedBoardFile = {
    signedUrl: string;
} & BoardFile;

type BoardToken = {
    boardId: string;
    createdAt: string;
    id: string;
    token: string;
    updatedAt: string;
};

type Feedback = {
    boardId: null | string;
    comment: string;
    createdAt: string;
    email: null | string;
    id: string;
    respondedAt?: null | string;
};

export type { Board, BoardFile, BoardToken, Feedback, PresignedBoardFile };
