import type { Response, Request } from "express";
import { isEmpty } from "lodash-es";
import { BoardFilesStore } from "@/board-files/store";
import { BoardsStore } from "@/boards/store";
import { arrify } from "@/utilities/collection-utils";
import { BOARD_NOT_FOUND_ERROR, ValidationError } from "@/utilities/errors";
import { ok } from "@/utilities/responses";

const BoardFilesController = {
    create: async (request: Request, response: Response): Promise<Response> => {
        const { slug: boardSlug } = request.params;
        const { token } = request.body;
        const { files } = request;
        const displayNames = arrify<string>(request.body.displayNames);
        const emojis = arrify<string>(request.body.emojis);
        if (!Array.isArray(files) || isEmpty(files)) {
            throw new ValidationError(
                "'files' is required and must be an array."
            );
        }

        if (displayNames.length !== files.length) {
            throw new ValidationError("Each file must have a name defined");
        }

        if (emojis.length !== files.length) {
            throw new ValidationError(
                "Each file must have an emoji defined (or the string 'null' if no emoji is chosen)"
            );
        }

        const boardFiles = await BoardFilesStore.bulkInsert({
            boardSlug,
            displayNames,
            emojis,
            files,
            token,
        });

        return ok(response, boardFiles);
    },
    delete: async (request: Request, response: Response): Promise<Response> => {
        const { id, slug: boardSlug } = request.params;
        const { token } = request.body;
        const result = await BoardFilesStore.delete(id, boardSlug, token);

        return ok(response, result);
    },
    get: async (request: Request, response: Response): Promise<Response> => {
        const { id, slug } = request.params;
        const [board, boardFile] = await Promise.all([
            BoardsStore.unsafe__getBySlug(slug),
            BoardFilesStore.getById(id),
        ]);
        if (board === null || boardFile.board_id !== board.id) {
            throw BOARD_NOT_FOUND_ERROR;
        }

        return ok(response, boardFile);
    },
    list: async (request: Request, response: Response): Promise<Response> => {
        const { slug: boardSlug } = request.params;
        const token = request.query.token as string | undefined;
        const boardFiles = await (isEmpty(token)
            ? BoardFilesStore.listByBoardSlug(boardSlug)
            : BoardFilesStore.listByToken({
                  slug: boardSlug,
                  token: token!,
              }));

        return ok(response, boardFiles);
    },
    size: async (request: Request, response: Response): Promise<Response> => {
        const { slug: boardSlug } = request.params;
        const token = request.query.token as string;
        const size = await BoardFilesStore.getSizeByBoardSlugAndToken(
            boardSlug,
            token
        );

        return ok(response, size);
    },
    update: async (request: Request, response: Response): Promise<Response> => {
        const { id, slug: boardSlug } = request.params;
        const { file } = request;
        const { displayName, emoji, token } = request.body;

        const boardFile = await BoardFilesStore.update({
            boardSlug,
            displayName,
            emoji,
            file,
            id,
            token,
        });

        return ok(response, boardFile);
    },
};

export { BoardFilesController };
