import { afterEach, beforeEach, expect, it, vi } from "vitest";

vi.mock("dotenv", () => ({ default: { config: vi.fn() } }));

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllEnvs());

it("defaults PocketBase to its published local port when no URL is configured", async () => {
    vi.stubEnv("POCKETBASE_URL", undefined);

    const { POCKETBASE_URL } = await import("@/config");

    expect(POCKETBASE_URL).toBe("http://127.0.0.1:3435");
});

it.each(["http://pocketbase:8090", "https://pocketbase.example.com"])(
    "honors an explicit PocketBase URL: %s",
    async (url) => {
        vi.stubEnv("POCKETBASE_URL", url);

        const { POCKETBASE_URL } = await import("@/config");

        expect(POCKETBASE_URL).toBe(url);
    }
);
