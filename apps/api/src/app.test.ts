import type * as rateLimitModule from "express-rate-limit";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { Task } from "common";
import { request } from "node:http";
import { deflateSync, gzipSync } from "node:zlib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app, metrics } from "@/app";
import { BoardsService } from "@/boards/boards-service";
import { PocketBaseClient } from "@/pocketbase-client";
import { createRateLimiter, readRateLimiter } from "@/utilities/rate-limiter";

// Keep the real limiter and store, lowering the quota only in rate-limit cases.
const generalQuota = vi.hoisted(() => ({ max: 1000 }));

vi.mock("express-rate-limit", async (importOriginal) => {
    const actual = await importOriginal<typeof rateLimitModule>();
    return {
        ...actual,
        default: (options: Parameters<typeof actual.default>[0]) =>
            actual.default({
                ...options,
                max:
                    options?.max === 1000
                        ? () => generalQuota.max
                        : options?.max,
            }),
    };
});

describe("app", () => {
    let server: Server;
    let origin: string;

    const client = "198.51.100.10";
    const otherClient = "198.51.100.11";
    const headers = (ip = client, prefix = "203.0.113.1") => ({
        "X-Forwarded-For": `${prefix}, ${ip}`,
    });

    beforeEach(async () => {
        metrics.registry.resetMetrics();
        for (const ip of [client, otherClient, "127.0.0.1"]) {
            readRateLimiter.resetKey(ip);
            createRateLimiter.resetKey(ip);
        }
        server = app.listen(0, "127.0.0.1");
        await new Promise<void>((resolve) => server.once("listening", resolve));
        origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        await new Promise<void>((resolve, reject) =>
            server.close((error) => (error != null ? reject(error) : resolve()))
        );
    });

    it("returns the shared response when PocketBase is available", async () => {
        const check = vi
            .spyOn(PocketBaseClient, "healthcheck")
            .mockResolvedValue();
        const response = await fetch(`${origin}/health`);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true });
        expect(check).toHaveBeenCalledOnce();
    });

    it("returns 503 without exposing dependency errors", async () => {
        vi.spyOn(PocketBaseClient, "healthcheck").mockRejectedValue(
            new Error("dependency unavailable")
        );
        const response = await fetch(`${origin}/health`);
        expect(response.status).toBe(503);
        expect(await response.json()).toEqual({ ok: false });
    });

    it("does not retain the old health route", async () => {
        const check = vi.spyOn(PocketBaseClient, "healthcheck");
        expect((await fetch(`${origin}/healthcheck`)).status).toBe(404);
        expect(check).not.toHaveBeenCalled();
    });

    it("keeps the metrics endpoint off the public API", async () => {
        const response = await fetch(`${origin}/metrics`);
        const text = await metrics.registry.metrics();

        expect(response.status).toBe(404);
        expect(text).toContain('route="__unmatched__",status_code="404"');
    });

    it("records JSON parser failures before route matching", async () => {
        const options = {
            body: "{",
            headers: { "Content-Type": "application/json" },
            method: "POST",
        };

        const response = await fetch(`${origin}/boards`, options);
        const text = await metrics.registry.metrics();

        expect(response.status).toBe(500);
        expect(text).toContain('route="__unmatched__",status_code="500"');
    });

    it("keeps an absent upload body as a validation failure", async () => {
        const response = await fetch(`${origin}/boards/parser-probe/files`, {
            method: "POST",
        });

        expect(response.status).toBe(400);
    });

    it("accepts compressed JSON without changing routing", async () => {
        const response = await fetch(`${origin}/__parser_probe__`, {
            body: new Uint8Array(gzipSync('{"name":"parser-probe"}')),
            headers: {
                "Content-Encoding": "gzip",
                "Content-Type": "application/json",
            },
            method: "POST",
        });

        expect(response.status).toBe(404);
    });

    it("finishes a compressed request before delayed trailing bytes without losing the listener", async () => {
        vi.spyOn(PocketBaseClient, "healthcheck").mockResolvedValue();
        const first = Buffer.concat([
            new Uint8Array(deflateSync('{"name":"parser-probe"}')),
            new Uint8Array([0]),
        ]);
        const trailing = Buffer.alloc(1024);
        const status = await new Promise<number | undefined>(
            (resolve, reject) => {
                const client = request(
                    `${origin}/health`,
                    {
                        headers: {
                            "Content-Encoding": "deflate",
                            "Content-Length": first.length + trailing.length,
                            "Content-Type": "application/json",
                        },
                        method: "GET",
                    },
                    (response) => {
                        // Send the remaining bytes only after the parser has handed off.
                        client.end(trailing);
                        response.resume();
                        response.once("error", reject);
                        response.once("end", () =>
                            resolve(response.statusCode)
                        );
                    }
                );
                client.once("error", reject);
                client.setTimeout(2000, () =>
                    client.destroy(new Error("Parser did not finish"))
                );
                client.write(first);
            }
        );
        const next = await fetch(`${origin}/__parser_probe__`);

        expect(status).toBe(200);
        expect(next.status).toBe(404);
    });

    describe("rate limiting", () => {
        beforeEach(() => {
            generalQuota.max = 2;
            app.set("trust proxy", 1);
            vi.spyOn(PocketBaseClient, "healthcheck").mockResolvedValue();
            vi.spyOn(BoardsService, "getAllPublic").mockReturnValue(
                Task.ok([])
            );
            vi.spyOn(BoardsService, "insert").mockReturnValue(
                Task.ok({
                    createdAt: "2026-10-24T00:00:00Z",
                    id: "board-a",
                    name: "Drums",
                    slug: "drums",
                    token: "token-a",
                    updatedAt: "2026-10-24T00:00:00Z",
                    viewPermission: "public",
                })
            );
        });

        afterEach(() => {
            generalQuota.max = 1000;
            app.set("trust proxy", 0);
        });

        it("ignores forged forwarding headers when running without a proxy", async () => {
            app.set("trust proxy", 0);

            try {
                const first = await fetch(`${origin}/boards`, {
                    headers: headers(client),
                });
                const second = await fetch(`${origin}/boards`, {
                    headers: headers(otherClient),
                });
                const blocked = await fetch(`${origin}/boards`, {
                    headers: headers("198.51.100.12"),
                });

                expect(first.status).toBe(200);
                expect(second.status).toBe(200);
                expect(blocked.status).toBe(429);
            } finally {
                app.set("trust proxy", 1);
            }
        });

        it("limits successful reads and preserves the 429 response contract", async () => {
            const first = await fetch(`${origin}/boards`, {
                headers: headers(),
            });
            const second = await fetch(`${origin}/boards`, {
                headers: headers(),
            });
            const blocked = await fetch(`${origin}/boards`, {
                headers: headers(),
            });
            const payload = await blocked.json();

            expect(first.status).toBe(200);
            expect(second.status).toBe(200);
            expect(blocked.status).toBe(429);
            expect(blocked.headers.get("Retry-After")).not.toBeNull();
            expect(blocked.headers.get("RateLimit-Remaining")).toBe("0");
            expect(payload).toMatchObject({
                data: null,
                error: { name: "ERROR_RATE_LIMIT_EXCEEDED" },
            });
        });

        it("uses only the nearest forwarded client and keeps clients independent", async () => {
            const first = await fetch(`${origin}/boards`, {
                headers: headers(client, "203.0.113.1"),
            });
            const second = await fetch(`${origin}/boards`, {
                headers: headers(client, "203.0.113.2"),
            });
            const blocked = await fetch(`${origin}/boards`, {
                headers: headers(client, "203.0.113.3"),
            });
            const independent = await fetch(`${origin}/boards`, {
                headers: headers(otherClient),
            });

            expect(app.get("trust proxy")).toBe(1);
            expect(first.status).toBe(200);
            expect(second.status).toBe(200);
            expect(blocked.status).toBe(429);
            expect(independent.status).toBe(200);
        });

        it("keeps health checks and CORS preflights outside the quota", async () => {
            for (let attempt = 0; attempt < 3; attempt += 1) {
                const health = await fetch(`${origin}/health`, {
                    headers: headers(),
                });

                expect(health.status).toBe(200);
                expect(health.headers.get("RateLimit-Limit")).toBeNull();
            }

            const first = await fetch(`${origin}/boards`, {
                headers: headers(),
            });
            const second = await fetch(`${origin}/boards`, {
                headers: headers(),
            });
            const blocked = await fetch(`${origin}/boards`, {
                headers: headers(),
            });
            const healthy = await fetch(`${origin}/health`, {
                headers: headers(),
            });
            const preflight = await fetch(`${origin}/boards`, {
                headers: {
                    ...headers(),
                    "Access-Control-Request-Method": "GET",
                    Origin: "https://example.com",
                },
                method: "OPTIONS",
            });

            expect(first.status).toBe(200);
            expect(second.status).toBe(200);
            expect(blocked.status).toBe(429);
            expect(healthy.status).toBe(200);
            expect(preflight.status).toBe(204);
        });

        it("counts writes in the general request quota", async () => {
            const first = await fetch(`${origin}/boards`, {
                headers: headers(),
                method: "POST",
            });
            const second = await fetch(`${origin}/boards`, {
                headers: headers(),
                method: "POST",
            });
            const blocked = await fetch(`${origin}/boards`, {
                headers: headers(),
            });

            expect(first.status).toBe(201);
            expect(second.status).toBe(201);
            expect(blocked.status).toBe(429);
        });

        it("retains the separate ten-board creation limit", async () => {
            for (let attempt = 0; attempt < 10; attempt += 1) {
                readRateLimiter.resetKey(client);

                const response = await fetch(`${origin}/boards`, {
                    headers: headers(),
                    method: "POST",
                });

                expect(response.status).toBe(201);
            }
            readRateLimiter.resetKey(client);

            const blocked = await fetch(`${origin}/boards`, {
                headers: headers(),
                method: "POST",
            });
            const payload = await blocked.json();

            expect(blocked.status).toBe(429);
            expect(payload.error.message).toContain("created too many boards");
        });
    });
});
