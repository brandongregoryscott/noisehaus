import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "@/app";
import { PocketBaseClient } from "@/pocketbase-client";

describe("app", () => {
    let server: Server;
    let origin: string;

    beforeEach(async () => {
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
});
