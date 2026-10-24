import type { Express } from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { createMetrics } from "@/metrics";

const servers: Server[] = [];

async function serve(app: Express) {
    const server = app.listen(0, "127.0.0.1");
    servers.push(server);
    await new Promise<void>((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
    });
    return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

afterEach(async () => {
    await Promise.all(
        servers.splice(0).map(
            (server) =>
                new Promise<void>((resolve, reject) => {
                    if (!server.listening) {
                        resolve();
                        return;
                    }
                    server.close((error) =>
                        error == null ? resolve() : reject(error)
                    );
                    server.closeAllConnections();
                })
        )
    );
});

describe("createMetrics", () => {
    it("aggregates requests by template and status without exposing credentials or identifiers", async () => {
        const metrics = createMetrics();
        const app = express();
        app.use(metrics.middleware);
        app.get("/boards/:slug/files/:id", (_req, res) =>
            res.status(503).end()
        );
        const origin = await serve(app);
        const endpoint = await serve(metrics.app);

        await fetch(
            `${origin}/boards/private-board/files/private-file?token=private-query`,
            {
                headers: { Authorization: "Bearer private-header" },
            }
        );
        await fetch(`${origin}/boards/another-board/files/another-file`);
        const response = await fetch(`${endpoint}/metrics`);
        const text = await response.text();

        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toContain("text/plain");
        expect(text).toContain(
            'http_request_duration_seconds_count{method="GET",route="/boards/:slug/files/:id",status_code="503"} 2'
        );
        expect(text).toContain(
            'http_request_duration_seconds_bucket{le="0.005",'
        );
        expect(text).toContain("process_resident_memory_bytes");
        expect(text).toContain("nodejs_eventloop_lag_p99_seconds");
        for (const secret of [
            "private-board",
            "private-file",
            "private-query",
            "private-header",
            "another-board",
            "another-file",
        ]) {
            expect(text).not.toContain(secret);
        }
    });

    it("groups unknown paths and unusual methods into bounded labels", async () => {
        const metrics = createMetrics();
        const app = express();
        app.use(metrics.middleware);
        const origin = await serve(app);

        await fetch(`${origin}/first-private-path`);
        await fetch(`${origin}/second-private-path`);
        await fetch(`${origin}/custom-private-path`, { method: "PROPFIND" });
        const text = await metrics.registry.metrics();

        expect(text).toContain(
            'http_request_duration_seconds_count{method="GET",route="__unmatched__",status_code="404"} 2'
        );
        expect(text).toContain(
            'http_request_duration_seconds_count{method="OTHER",route="__unmatched__",status_code="404"} 1'
        );
        expect(text).not.toContain("private-path");
        expect(text).not.toContain("PROPFIND");
    });

    it("excludes health probes and metrics scrapes from request counts", async () => {
        const metrics = createMetrics();
        const app = express();
        app.use(metrics.middleware);
        app.get("/health", (_req, res) => res.status(503).end());
        const origin = await serve(app);
        const endpoint = await serve(metrics.app);

        await fetch(`${origin}/health`);
        await fetch(`${endpoint}/metrics`);
        const text = await metrics.registry.metrics();

        expect(text).not.toContain("http_request_duration_seconds_count{");
        expect(text).toContain("process_resident_memory_bytes");
    });

    it("keeps request observations isolated between registries", async () => {
        const first = createMetrics();
        const second = createMetrics();
        const app = express();
        app.use(first.middleware);
        const origin = await serve(app);

        await fetch(`${origin}/unknown`);
        const firstText = await first.registry.metrics();
        const secondText = await second.registry.metrics();

        expect(firstText).toContain('route="__unmatched__"');
        expect(secondText).not.toContain(
            "http_request_duration_seconds_count{"
        );
    });
});
