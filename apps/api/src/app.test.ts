import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { request } from "node:http";
import { deflateSync, gzipSync } from "node:zlib";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app, metrics } from "@/app";
import { PocketBaseClient } from "@/pocketbase-client";

describe("app", () => {
    let server: Server;
    let origin: string;

    beforeEach(async () => {
        metrics.registry.resetMetrics();
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
});
