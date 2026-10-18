import type { Response, Request } from "express";
import { isEmpty } from "lodash-es";
import { BoardFilesService } from "@/board-files/service";
import { arrify } from "@/utilities/collection-utils";
import { ValidationError } from "@/utilities/errors";
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

        const boardFiles = await BoardFilesService.bulkInsert({
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
        const result = await BoardFilesService.delete(id, boardSlug, token);

        return ok(response, result);
    },
    get: async (request: Request, response: Response): Promise<Response> => {
        const { id, slug: boardSlug } = request.params;
        const token = request.query.token as string | undefined;
        const boardFile = await BoardFilesService.get({ boardSlug, id, token });

        return ok(response, boardFile);
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

        return ok(response, boardFiles);
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

        return ok(response, boardFile);
    },
};

export { BoardFilesController };
