import { ErrorName } from "common";
import { afterEach, assert, describe, expect, it, vi } from "vitest";
import {
    _delete,
    get,
    post,
    postMultipartForm,
    put,
    putMultipartForm,
} from "./fetch";

const mockFetch = vi.fn<typeof fetch>();

describe("fetch", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        mockFetch.mockReset();
    });

    it("unwraps successful envelopes and preserves valid error responses", async () => {
        vi.stubGlobal("fetch", mockFetch);
        const board = { id: "board-a" };
        mockFetch.mockResolvedValueOnce(
            Response.json({ data: board, error: null })
        );
        const result = await get<typeof board>("/boards/drums");
        assert(result.isOk);
        expect(result.value).toEqual(board);

        const error = {
            message: "Board not found",
            name: ErrorName.ERROR_NOT_FOUND,
        };
        mockFetch.mockResolvedValueOnce(
            Response.json({ data: null, error }, { status: 404 })
        );
        const failure = await get("/boards/missing");
        assert(failure.isErr);
        expect(failure.error).toEqual(error);
    });

    it("returns typed errors for failed transport and invalid responses", async () => {
        const testCases = [
            {
                name: "network failure",
                response: () =>
                    Promise.reject(new TypeError("Failed to fetch")),
            },
            {
                name: "invalid JSON",
                response: () => Promise.resolve(new Response("not json")),
            },
            {
                name: "missing envelope",
                response: () =>
                    Promise.resolve(Response.json({ id: "board-a" })),
            },
            {
                name: "invalid error shape",
                response: () =>
                    Promise.resolve(
                        Response.json({ data: null, error: { name: 123 } })
                    ),
            },
            {
                name: "error status with success envelope",
                response: () =>
                    Promise.resolve(
                        Response.json(
                            { data: true, error: null },
                            { status: 500 }
                        )
                    ),
            },
        ];
        vi.stubGlobal("fetch", mockFetch);
        for (const { name, response } of testCases) {
            mockFetch.mockReset().mockImplementation(response);
            const result = await get("/boards/drums");
            assert(result.isErr, name);
            expect(result.error.name, name).toBe(ErrorName.ERROR_UNHANDLED);
            expect(result.error.message, name).not.toBe("");
            expect(mockFetch, name).toHaveBeenCalledTimes(1);
        }
    });

    it("preserves false success values", async () => {
        vi.stubGlobal(
            "fetch",
            mockFetch.mockResolvedValue(
                Response.json({ data: false, error: null })
            )
        );
        const result = await get<boolean>("/status");
        assert(result.isOk);
        expect(result.value).toBe(false);
    });

    it("sends JSON and multipart requests without retrying writes", async () => {
        const formData = new FormData();
        formData.set("token", "token-a");
        const body = { token: "token-a" };
        const testCases = [
            {
                body: JSON.stringify(body),
                method: "POST",
                multipart: false,
                operation: () => post("/boards", body),
            },
            {
                body: JSON.stringify(body),
                method: "PUT",
                multipart: false,
                operation: () => put("/boards/drums", body),
            },
            {
                body: JSON.stringify(body),
                method: "DELETE",
                multipart: false,
                operation: () => _delete("/boards/drums", body),
            },
            {
                body: formData,
                method: "POST",
                multipart: true,
                operation: () => postMultipartForm("/files", formData),
            },
            {
                body: formData,
                method: "PUT",
                multipart: true,
                operation: () => putMultipartForm("/files/sound", formData),
            },
        ];
        vi.stubGlobal("fetch", mockFetch);
        for (const {
            body: expectedBody,
            method,
            multipart,
            operation,
        } of testCases) {
            mockFetch
                .mockReset()
                .mockResolvedValue(Response.json({ data: true, error: null }));
            const result = await operation();
            assert(result.isOk, method);
            expect(mockFetch, method).toHaveBeenCalledTimes(1);
            const options = mockFetch.mock.calls[0][1];
            expect(options?.method).toBe(method);
            expect(options?.body).toBe(expectedBody);
            expect(new Headers(options?.headers).get("Content-Type")).toBe(
                multipart ? null : "application/json"
            );
        }
    });
});
