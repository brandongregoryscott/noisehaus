import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
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
});
