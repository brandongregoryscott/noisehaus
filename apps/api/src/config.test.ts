import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

describe("metrics configuration", () => {
    it("defaults the native listener to loopback on port 9464", async () => {
        vi.stubEnv("METRICS_HOST", undefined);
        vi.stubEnv("METRICS_PORT", undefined);

        const { METRICS_HOST, METRICS_PORT } = await import("@/config");

        expect(METRICS_HOST).toBe("127.0.0.1");
        expect(METRICS_PORT).toBe(9464);
    });

    it("honors explicit listener settings", async () => {
        vi.stubEnv("METRICS_HOST", "0.0.0.0");
        vi.stubEnv("METRICS_PORT", "9465");

        const { METRICS_HOST, METRICS_PORT } = await import("@/config");

        expect(METRICS_HOST).toBe("0.0.0.0");
        expect(METRICS_PORT).toBe(9465);
    });

    it.each(["", "0", "-1", "65536", "1.5", "invalid"])(
        "rejects invalid metrics port %s",
        async (port) => {
            vi.stubEnv("METRICS_PORT", port);

            const configuration = import("@/config");

            await expect(configuration).rejects.toThrow(
                "Invalid METRICS_PORT."
            );
        }
    );

    it("rejects an empty listener host", async () => {
        vi.stubEnv("METRICS_HOST", " ");

        const configuration = import("@/config");

        await expect(configuration).rejects.toThrow("Invalid METRICS_HOST.");
    });
});
