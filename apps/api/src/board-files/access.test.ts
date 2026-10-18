import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { ViewPermission } from "common";
import {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import { app } from "@/app";
import { PocketBaseClient } from "@/pocketbase-client";
import { BOARD_NOT_FOUND_ERROR } from "@/utilities/errors";
import { logger } from "@/utilities/logger";

type FixtureRecord = Record<string, unknown>;

const boardFile = {
    boardId: "board-a",
    createdAt: "2026-10-17T00:00:00Z",
    displayName: "Sound A",
    emoji: "",
    file: "sound-a.wav",
    id: "file-a",
    position: 0,
    size: 10,
    updatedAt: "2026-10-17T00:00:00Z",
};

describe("board-file access HTTP contract", () => {
    const logLevel = logger.level;
    let server: Server;
    let origin: string;

    beforeAll(async () => {
        logger.level = "silent";
        server = app.listen(0, "127.0.0.1");
        await new Promise<void>((resolve, reject) => {
            server.once("error", reject);
            server.once("listening", resolve);
        });
        origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    afterAll(async () => {
        logger.level = logLevel;
        if (server.listening) {
            await new Promise<void>((resolve, reject) =>
                server.close((error) =>
                    error != null ? reject(error) : resolve()
                )
            );
        }
    });

    beforeEach(() => {
        const records: Record<string, FixtureRecord[]> = {
            boardFiles: [
                boardFile,
                { ...boardFile, boardId: "board-b", id: "file-b" },
                { ...boardFile, boardId: "board-c", id: "file-c" },
            ],
            boards: [
                {
                    id: "board-a",
                    slug: "a",
                    viewPermission: ViewPermission.BySlug,
                },
                {
                    id: "board-b",
                    slug: "b",
                    viewPermission: ViewPermission.ByToken,
                },
                {
                    id: "board-c",
                    slug: "c",
                    viewPermission: ViewPermission.Public,
                },
            ],
            boardTokens: [
                { boardId: "board-a", token: "token-a" },
                { boardId: "board-b", token: "token-b" },
                { boardId: "board-c", token: "token-c" },
            ],
        };

        // Keep routing, authorization, and ownership checks real. Only replace
        // persistence, interpreting the equality filters used by these lookups.
        vi.spyOn(PocketBaseClient, "getFirstRecordByFilter").mockImplementation(
            async <T>(
                collection: string,
                filter: string
            ): Promise<null | T> => {
                const record = records[collection]?.find((candidate) =>
                    filter.split(" && ").every((clause) => {
                        const match = /^(\w+) = "([^"]*)"$/.exec(clause);
                        return (
                            match !== null && candidate[match[1]] === match[2]
                        );
                    })
                );
                return (record as T | undefined) ?? null;
            }
        );
        vi.spyOn(PocketBaseClient, "updateRecord").mockImplementation(
            async <T>(_collection: string, id: string): Promise<T> =>
                ({
                    ...records.boardFiles.find((record) => record.id === id),
                    displayName: "Updated",
                }) as T
        );
        vi.spyOn(PocketBaseClient, "deleteRecord").mockResolvedValue();
        vi.spyOn(PocketBaseClient, "listRecords").mockResolvedValue([]);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const expectNotFound = async (response: Response) => {
        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({
            data: null,
            error: {
                message: BOARD_NOT_FOUND_ERROR.message,
                name: BOARD_NOT_FOUND_ERROR.name,
            },
        });
        expect(PocketBaseClient.updateRecord).not.toHaveBeenCalled();
        expect(PocketBaseClient.deleteRecord).not.toHaveBeenCalled();
        expect(PocketBaseClient.listRecords).not.toHaveBeenCalled();
    };

    describe.each(["PUT", "DELETE"])("%s", (method) => {
        const mutate = (slug: string, id: string, token?: string) => {
            const form = new FormData();
            form.set("displayName", "Updated");
            if (token !== undefined) {
                form.set("token", token);
            }

            return fetch(`${origin}/boards/${slug}/files/${id}`, {
                body: method === "PUT" ? form : JSON.stringify({ token }),
                headers:
                    method === "PUT"
                        ? undefined
                        : { "Content-Type": "application/json" },
                method,
            });
        };

        it.each([
            ["a", "file-a", "token-a"],
            ["b", "file-b", "token-b"],
        ])("allows the owning board's token (%s)", async (slug, id, token) => {
            const response = await mutate(slug, id, token);
            expect(response.status).toBe(200);
            expect(await response.json()).toMatchObject({
                data: method === "PUT" ? { id } : true,
                error: null,
            });
            if (method === "PUT") {
                expect(PocketBaseClient.updateRecord).toHaveBeenCalledWith(
                    "boardFiles",
                    id,
                    { displayName: "Updated" }
                );
            } else {
                expect(PocketBaseClient.deleteRecord).toHaveBeenCalledWith(
                    "boardFiles",
                    id
                );
            }
        });

        it.each([
            ["a", "file-b", "token-a"],
            ["b", "file-a", "token-b"],
        ])(
            "rejects a file belonging to another board (%s)",
            async (slug, id, token) => {
                await expectNotFound(await mutate(slug, id, token));
            }
        );

        it.each([undefined, "", "invalid", "token-b"])(
            "rejects a missing or invalid token (%s)",
            async (token) => {
                await expectNotFound(await mutate("a", "file-a", token));
            }
        );

        it("does not reveal whether a missing file exists", async () => {
            await expectNotFound(await mutate("a", "missing", "token-a"));
        });

        it("rejects a missing board", async () => {
            await expectNotFound(await mutate("missing", "file-a", "token-a"));
        });
    });

    it("rejects cross-board replacement before quota checks or writes", async () => {
        const form = new FormData();
        form.set("token", "token-a");
        form.set(
            "file",
            new Blob(["replacement"], { type: "audio/wav" }),
            "sound.wav"
        );
        const response = await fetch(`${origin}/boards/a/files/file-b`, {
            body: form,
            method: "PUT",
        });
        await expectNotFound(response);
    });

    describe("GET", () => {
        it.each([
            ["a", "file-a", ""],
            ["c", "file-c", ""],
            ["b", "file-b", "?token=token-b"],
        ])(
            "reads an accessible board's own file (%s)",
            async (slug, id, query) => {
                const response = await fetch(
                    `${origin}/boards/${slug}/files/${id}${query}`
                );
                expect(response.status).toBe(200);
                expect(await response.json()).toMatchObject({
                    data: { id },
                    error: null,
                });
            }
        );

        it.each([
            ["b", "file-b", ""],
            ["b", "file-b", "?token=invalid"],
            ["b", "file-b", "?token=token-a"],
            ["a", "file-b", ""],
            ["b", "file-a", "?token=token-b"],
            ["a", "missing", ""],
            ["missing", "file-a", ""],
            ["a", "file-a", "?token=token-a&token=token-b"],
        ])("conceals inaccessible files (%s/%s%s)", async (slug, id, query) => {
            await expectNotFound(
                await fetch(`${origin}/boards/${slug}/files/${id}${query}`)
            );
        });
    });
});
