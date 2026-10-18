import { afterEach, expect, it, vi } from "vitest";

vi.mock("@/config", () => ({
    POCKETBASE_SUPERUSER_EMAIL: "test@example.com",
    POCKETBASE_SUPERUSER_PASSWORD: "test-password",
    POCKETBASE_URL: "http://pocketbase.test",
}));

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

it("shares one health deadline across authentication and the native health request", async () => {
    vi.resetModules();
    const controller = new AbortController();
    const timeout = vi
        .spyOn(AbortSignal, "timeout")
        .mockReturnValue(controller.signal);
    const request = vi
        .fn()
        .mockResolvedValueOnce(Response.json({ token: "test-token" }))
        .mockResolvedValueOnce(Response.json({ code: 200 }));
    vi.stubGlobal("fetch", request);
    const { PocketBaseClient } = await import("@/pocketbase-client");
    await PocketBaseClient.healthcheck();
    expect(timeout).toHaveBeenCalledWith(3000);
    expect(request).toHaveBeenNthCalledWith(
        1,
        "http://pocketbase.test/api/collections/_superusers/auth-with-password",
        expect.objectContaining({ signal: controller.signal })
    );
    expect(request).toHaveBeenNthCalledWith(
        2,
        "http://pocketbase.test/api/health",
        expect.objectContaining({ signal: controller.signal })
    );
});

it("cancels a stalled authentication request when the health deadline expires", async () => {
    vi.resetModules();
    const controller = new AbortController();
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
    vi.stubGlobal(
        "fetch",
        vi.fn(
            (_url: string, options: RequestInit) =>
                new Promise((_resolve, reject) => {
                    options.signal?.addEventListener("abort", () =>
                        reject(options.signal?.reason)
                    );
                })
        )
    );
    const { PocketBaseClient } = await import("@/pocketbase-client");
    const pending = PocketBaseClient.healthcheck();
    const rejected = expect(pending).rejects.toThrow("deadline expired");
    controller.abort(new Error("deadline expired"));
    await rejected;
});

it("submits related record creation as one multipart batch", async () => {
    vi.resetModules();
    const upload = new FormData();
    upload.set("displayName", "Sound");
    upload.set("file", new Blob(["sound"], { type: "audio/wav" }), "sound.wav");
    const fetch = vi
        .fn()
        .mockResolvedValueOnce(Response.json({ token: "test-token" }))
        .mockResolvedValueOnce(
            Response.json([
                { body: { id: "board-a" }, status: 200 },
                { body: { id: "file-a" }, status: 200 },
            ])
        );
    vi.stubGlobal("fetch", fetch);
    const { PocketBaseClient } = await import("@/pocketbase-client");

    const result = await PocketBaseClient.createRecords([
        { collection: "boards", data: { id: "board-a", name: "Board" } },
        { collection: "boardFiles", data: upload },
    ]);

    expect(result).toEqual([{ id: "board-a" }, { id: "file-a" }]);
    expect(fetch).toHaveBeenCalledTimes(2);
    const [url, options] = fetch.mock.calls[1];
    expect(url).toBe("http://pocketbase.test/api/batch");
    const form = options.body as FormData;
    expect(JSON.parse(form.get("@jsonPayload") as string)).toEqual({
        requests: [
            {
                body: { id: "board-a", name: "Board" },
                method: "POST",
                url: "/api/collections/boards/records",
            },
            {
                body: { displayName: "Sound" },
                method: "POST",
                url: "/api/collections/boardFiles/records",
            },
        ],
    });
    const file = form.get("requests.1.file") as File;
    expect(file.name).toBe("sound.wav");
    expect(await file.text()).toBe("sound");
    expect(options.headers.has("Content-Type")).toBe(false);
});

it("unwraps batch field errors so slug collisions still reach retry handling", async () => {
    vi.resetModules();
    const response = {
        data: {
            slug: { code: "validation_not_unique", message: "Slug is taken" },
        },
        message: "Failed to create record",
        status: 400,
    };
    const fetch = vi
        .fn()
        .mockResolvedValueOnce(Response.json({ token: "test-token" }))
        .mockResolvedValueOnce(
            Response.json(
                {
                    data: {
                        requests: {
                            "0": { code: "batch_request_failed", response },
                        },
                    },
                },
                { status: 400 }
            )
        );
    vi.stubGlobal("fetch", fetch);
    const { PocketBaseClient, PocketBaseHttpError } =
        await import("@/pocketbase-client");

    const result = PocketBaseClient.createRecords([
        { collection: "boards", data: { slug: "taken" } },
    ]);

    await expect(result).rejects.toBeInstanceOf(PocketBaseHttpError);
    await expect(result).rejects.toMatchObject({ data: response, status: 400 });
    expect(fetch).toHaveBeenCalledTimes(2);
});

it("does not retry a batch when its response is lost", async () => {
    vi.resetModules();
    const error = new TypeError("Connection closed");
    const fetch = vi
        .fn()
        .mockResolvedValueOnce(Response.json({ token: "test-token" }))
        .mockRejectedValueOnce(error);
    vi.stubGlobal("fetch", fetch);
    const { PocketBaseClient } = await import("@/pocketbase-client");

    const result = PocketBaseClient.createRecords([
        { collection: "boards", data: { slug: "a" } },
    ]);

    await expect(result).rejects.toMatchObject({
        cause: error,
        name: "PocketBaseTransportError",
    });
    expect(fetch).toHaveBeenCalledTimes(2);
});

it("lists every page so quota checks cannot omit later files", async () => {
    vi.resetModules();
    const fetch = vi
        .fn()
        .mockResolvedValueOnce(Response.json({ token: "test-token" }))
        .mockResolvedValueOnce(
            Response.json({ items: [{ id: "first" }], totalPages: 2 })
        )
        .mockResolvedValueOnce(
            Response.json({ items: [{ id: "last" }], totalPages: 2 })
        );
    vi.stubGlobal("fetch", fetch);
    const { PocketBaseClient } = await import("@/pocketbase-client");

    const result = await PocketBaseClient.listRecords("boardFiles", {
        filter: 'boardId = "a"',
        sort: "id",
    });

    expect(result).toEqual([{ id: "first" }, { id: "last" }]);
    const url = new URL(fetch.mock.calls[2][0]);
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("filter")).toBe('boardId = "a"');
    expect(url.searchParams.get("sort")).toBe("id");
});

it("looks up the first matching record without fetching later pages", async () => {
    vi.resetModules();
    const fetch = vi
        .fn()
        .mockResolvedValueOnce(Response.json({ token: "test-token" }))
        .mockResolvedValueOnce(
            Response.json({ items: [{ id: "first" }], totalPages: 10 })
        );
    vi.stubGlobal("fetch", fetch);
    const { PocketBaseClient } = await import("@/pocketbase-client");

    const result = await PocketBaseClient.getFirstRecordByFilter(
        "boards",
        'slug = "a"'
    );

    expect(result).toEqual({ id: "first" });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(new URL(fetch.mock.calls[1][0]).searchParams.get("perPage")).toBe(
        "1"
    );
});

it("preserves parse failures as transport errors", async () => {
    vi.resetModules();
    vi.stubGlobal(
        "fetch",
        vi
            .fn()
            .mockResolvedValueOnce(Response.json({ token: "test-token" }))
            .mockResolvedValueOnce(
                new Response("invalid json", {
                    headers: { "Content-Type": "application/json" },
                })
            )
    );
    const { PocketBaseClient, PocketBaseTransportError } =
        await import("@/pocketbase-client");
    const result = PocketBaseClient.healthcheck();
    await expect(result).rejects.toBeInstanceOf(PocketBaseTransportError);
    await expect(result).rejects.toHaveProperty(
        "cause",
        expect.any(SyntaxError)
    );
});
