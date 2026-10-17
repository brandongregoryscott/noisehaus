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
