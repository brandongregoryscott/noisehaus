import type { Database } from "../generated/database";

type Board = Database["public"]["Tables"]["board"]["Row"];

type BoardFile = Database["public"]["Tables"]["board_file"]["Row"];

type PresignedBoardFile = {
    signedUrl: string;
} & BoardFile;

type BoardToken = Database["public"]["Tables"]["board_token"]["Row"];

export type { Board, BoardFile, BoardToken, PresignedBoardFile };
