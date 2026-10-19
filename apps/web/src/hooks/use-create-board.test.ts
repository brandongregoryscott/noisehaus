import type { ApiError, CreateBoardOptions } from "common";
import * as ReactQuery from "@tanstack/react-query";
import { ErrorName, ViewPermission } from "common";
import { afterEach, assert, describe, expect, it, vi } from "vitest";
import type { CreateBoardMutationResult } from "./use-create-board";
import type { CreateBoardFileOptions } from "./use-create-board-file";
import { useCreateBoard } from "./use-create-board";

// Capture the real hook's mutation options and execute them through Query's mutation cache.
vi.mock("@tanstack/react-query", async (importOriginal) => ({
    ...(await importOriginal<typeof ReactQuery>()),
    useMutation: vi.fn((options) => options),
}));

const board = {
    createdAt: "2026-10-18T00:00:00Z",
    id: "board-a",
    name: "Drums",
    slug: "drums",
    token: "token-a",
    updatedAt: "2026-10-18T00:00:00Z",
    viewPermission: ViewPermission.BySlug,
};
const files = [
    { displayName: "Sound", file: new File(["sound"], "sound.wav") },
];
const runMutation = async (withFiles = true) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- useMutation is mocked to expose options without rendering React.
    const options = useCreateBoard() as unknown as ReactQuery.MutationOptions<
        CreateBoardMutationResult,
        ApiError,
        { files?: CreateBoardFileOptions[] } & CreateBoardOptions
    >;
    const client = new ReactQuery.QueryClient({
        defaultOptions: { mutations: { retry: false } },
    });
    const mutation = client.getMutationCache().build(client, options);
    try {
        return await mutation.execute({
            name: board.name,
            slug: board.slug,
            ...(withFiles ? { files } : {}),
        });
    } finally {
        client.clear();
    }
};

describe("useCreateBoard", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("rejects creation failures through Query without attempting an upload", async () => {
        const error = {
            message: "Invalid board",
            name: ErrorName.ERROR_VALIDATION,
        };
        const request = vi
            .fn<typeof fetch>()
            .mockResolvedValue(
                Response.json({ data: null, error }, { status: 400 })
            );
        vi.stubGlobal("fetch", request);

        const result = runMutation();

        await expect(result).rejects.toEqual(error);
        expect(request).toHaveBeenCalledTimes(1);
    });

    it("returns the created board without uploading when no files were supplied", async () => {
        const request = vi
            .fn<typeof fetch>()
            .mockResolvedValue(Response.json({ data: board, error: null }));
        vi.stubGlobal("fetch", request);

        const result = await runMutation(false);

        expect(result).toEqual({
            data: board,
            error: null,
        });
        expect(request).toHaveBeenCalledTimes(1);
    });

    it("retains the board and token for every upload outcome without retrying", async () => {
        const validation = {
            message: "Quota exceeded",
            name: ErrorName.ERROR_VALIDATION,
        };
        const testCases = [
            {
                error: null,
                name: "success",
                response: () =>
                    Promise.resolve(Response.json({ data: [], error: null })),
            },
            {
                error: validation,
                name: "validation",
                response: () =>
                    Promise.resolve(
                        Response.json(
                            { data: null, error: validation },
                            { status: 400 }
                        )
                    ),
            },
            {
                error: {
                    message: expect.stringContaining("Check its sounds"),
                    name: ErrorName.ERROR_UNHANDLED,
                },
                name: "lost response",
                response: () =>
                    Promise.reject(new TypeError("Connection lost")),
            },
            {
                error: {
                    message: expect.stringContaining("Check its sounds"),
                    name: ErrorName.ERROR_UNHANDLED,
                },
                name: "invalid response",
                response: () => Promise.resolve(Response.json({})),
            },
        ];

        for (const { error, name, response } of testCases) {
            const request = vi
                .fn<typeof fetch>()
                .mockResolvedValueOnce(
                    Response.json({ data: board, error: null })
                )
                .mockImplementationOnce(response);
            vi.stubGlobal("fetch", request);

            const result = await runMutation();

            expect(result, name).toEqual({ data: board, error });
            expect(request, name).toHaveBeenCalledTimes(2);
            const upload = request.mock.calls[1][1]?.body as FormData;
            assert(upload instanceof FormData);
            expect(upload.get("token"), name).toBe(board.token);
        }
    });
});
