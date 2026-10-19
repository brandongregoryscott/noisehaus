import type { Response, Request } from "express";
import { ValidationError } from "common";
import { isEmpty } from "lodash-es";
import { BoardFilesService } from "@/board-files/board-files-service";
import { arrify } from "@/utilities/collection-utils";
import { error, ok } from "@/utilities/responses";

const BoardFilesController = {
    create: async (request: Request, response: Response): Promise<Response> => {
        const { slug: boardSlug } = request.params;
        const { token } = request.body;
        const { files } = request;
        const displayNames = arrify<string>(request.body.displayNames);
        const emojis = arrify<string>(request.body.emojis);
        if (!Array.isArray(files) || isEmpty(files)) {
            return error(
                response,
                new ValidationError("'files' is required and must be an array.")
            );
        }

        if (displayNames.length !== files.length) {
            return error(
                response,
                new ValidationError("Each file must have a name defined")
            );
        }

        if (emojis.length !== files.length) {
            return error(
                response,
                new ValidationError(
                    "Each file must have an emoji defined (or the string 'null' if no emoji is chosen)"
                )
            );
        }

        const boardFilesResult = await BoardFilesService.bulkInsert({
            boardSlug,
            displayNames,
            emojis,
            files,
            token,
        });

        return ok(response, boardFilesResult);
    },
    delete: async (request: Request, response: Response): Promise<Response> => {
        const { id, slug: boardSlug } = request.params;
        const { token } = request.body;
        const result = await BoardFilesService.delete(id, boardSlug, token);

        return ok(response, result);
    },
    get: async (request: Request, response: Response): Promise<Response> => {
        const { id, slug: boardSlug } = request.params;
        const token = request.query.token as string | undefined;
        const boardFileResult = await BoardFilesService.get({
            boardSlug,
            id,
            token,
        });

        return ok(response, boardFileResult);
    },
    list: async (request: Request, response: Response): Promise<Response> => {
        const { slug: boardSlug } = request.params;
        const token = request.query.token as string | undefined;
        const boardFilesResult = await (isEmpty(token)
            ? BoardFilesService.listByBoardSlug(boardSlug)
            : BoardFilesService.listByToken({
                  slug: boardSlug,
                  token: token!,
              }));

        return ok(response, boardFilesResult);
    },
    update: async (request: Request, response: Response): Promise<Response> => {
        const { id, slug: boardSlug } = request.params;
        const { file } = request;
        const { displayName, emoji, token } = request.body;

        const boardFileResult = await BoardFilesService.update({
            boardSlug,
            displayName,
            emoji,
            file,
            id,
            token,
        });

        return ok(response, boardFileResult);
    },
};

export { BoardFilesController };
