import type { Response, Request } from "express";
import { ValidationError } from "common";
import { isEmpty } from "lodash-es";
import { BoardFilesService } from "@/board-files/board-files-service";
import { sendErrorResponse, sendResultResponse } from "@/error-handler";
import { arrify } from "@/utilities/collection-utils";

const BoardFilesController = {
    create: async (request: Request, response: Response): Promise<Response> => {
        const { slug: boardSlug } = request.params;
        const { token } = request.body;
        const { files } = request;
        const displayNames = arrify<string>(request.body.displayNames);
        const emojis = arrify<string>(request.body.emojis);
        if (!Array.isArray(files) || isEmpty(files)) {
            return sendErrorResponse(
                new ValidationError(
                    "'files' is required and must be an array."
                ),
                request,
                response
            );
        }

        if (displayNames.length !== files.length) {
            return sendErrorResponse(
                new ValidationError("Each file must have a name defined"),
                request,
                response
            );
        }

        if (emojis.length !== files.length) {
            return sendErrorResponse(
                new ValidationError(
                    "Each file must have an emoji defined (or the string 'null' if no emoji is chosen)"
                ),
                request,
                response
            );
        }

        const boardFiles = await BoardFilesService.bulkInsert({
            boardSlug,
            displayNames,
            emojis,
            files,
            token,
        });

        return sendResultResponse(boardFiles, request, response);
    },
    delete: async (request: Request, response: Response): Promise<Response> => {
        const { id, slug: boardSlug } = request.params;
        const { token } = request.body;
        const result = await BoardFilesService.delete(id, boardSlug, token);

        return sendResultResponse(result, request, response);
    },
    get: async (request: Request, response: Response): Promise<Response> => {
        const { id, slug: boardSlug } = request.params;
        const token = request.query.token as string | undefined;
        const boardFile = await BoardFilesService.get({ boardSlug, id, token });

        return sendResultResponse(boardFile, request, response);
    },
    list: async (request: Request, response: Response): Promise<Response> => {
        const { slug: boardSlug } = request.params;
        const token = request.query.token as string | undefined;
        const boardFiles = await (isEmpty(token)
            ? BoardFilesService.listByBoardSlug(boardSlug)
            : BoardFilesService.listByToken({
                  slug: boardSlug,
                  token: token!,
              }));

        return sendResultResponse(boardFiles, request, response);
    },
    update: async (request: Request, response: Response): Promise<Response> => {
        const { id, slug: boardSlug } = request.params;
        const { file } = request;
        const { displayName, emoji, token } = request.body;

        const boardFile = await BoardFilesService.update({
            boardSlug,
            displayName,
            emoji,
            file,
            id,
            token,
        });

        return sendResultResponse(boardFile, request, response);
    },
};

export { BoardFilesController };
