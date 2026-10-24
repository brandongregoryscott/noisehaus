import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { MAX_FILE_COUNT_PER_UPLOAD, MAX_FILE_SIZE_IN_BYTES } from "common";
import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { errorHandler } from "@/error-handler";
import { multer } from "@/utilities/multer";

describe("upload parsing", () => {
    let server: Server;
    let origin: string;

    beforeAll(async () => {
        const app = express();
        app.post(
            "/files",
            multer.array("files", MAX_FILE_COUNT_PER_UPLOAD),
            (request, response) => {
                response.json({
                    files: Array.isArray(request.files)
                        ? request.files.map((file) => ({
                              content: file.buffer.toString(),
                              name: file.originalname,
                              type: file.mimetype,
                          }))
                        : [],
                    token: request.body.token,
                });
            }
        );
        app.put("/file", multer.single("file"), (request, response) => {
            response.json({ content: request.file?.buffer.toString() });
        });
        app.use(errorHandler);
        server = app.listen(0, "127.0.0.1");
        await new Promise<void>((resolve) => server.once("listening", resolve));
        origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    afterAll(async () => {
        await new Promise<void>((resolve, reject) =>
            server.close((error) => {
                if (error != null) {
                    reject(error);
                    return;
                }
                resolve();
            })
        );
    });

    it("keeps audio buffers, filenames and text fields for bulk uploads", async () => {
        const body = new FormData();
        body.append("token", "upload-token");
        body.append(
            "files",
            new Blob(["sound"], { type: "audio/wav" }),
            "sound.wav"
        );
        const response = await fetch(`${origin}/files`, {
            body,
            method: "POST",
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            files: [{ content: "sound", name: "sound.wav", type: "audio/wav" }],
            token: "upload-token",
        });
    });

    it("keeps single-file replacement uploads", async () => {
        const body = new FormData();
        body.append(
            "file",
            new Blob(["replacement"], { type: "audio/mpeg" }),
            "sound.mp3"
        );
        const response = await fetch(`${origin}/file`, { body, method: "PUT" });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ content: "replacement" });
    });

    it("rejects unsupported MIME types", async () => {
        const body = new FormData();
        body.append(
            "files",
            new Blob(["text"], { type: "text/plain" }),
            "text.txt"
        );
        const response = await fetch(`${origin}/files`, {
            body,
            method: "POST",
        });

        expect(response.status).toBe(400);
    });

    it("enforces the per-file size limit", async () => {
        const body = new FormData();
        body.append(
            "files",
            new Blob([new Uint8Array(MAX_FILE_SIZE_IN_BYTES + 1)], {
                type: "audio/wav",
            }),
            "large.wav"
        );
        const response = await fetch(`${origin}/files`, {
            body,
            method: "POST",
        });

        expect(response.status).toBe(400);
        expect((await response.json()).error.code).toBe("LIMIT_FILE_SIZE");
    });

    it("enforces the bulk file count limit", async () => {
        const body = new FormData();
        for (let index = 0; index <= MAX_FILE_COUNT_PER_UPLOAD; index += 1) {
            body.append(
                "files",
                new Blob(["sound"], { type: "audio/wav" }),
                `${index}.wav`
            );
        }
        const response = await fetch(`${origin}/files`, {
            body,
            method: "POST",
        });

        expect(response.status).toBe(400);
        expect((await response.json()).error.code).toBe(
            "LIMIT_UNEXPECTED_FILE"
        );
    });

    it("terminates malformed multipart requests and accepts the next upload", async () => {
        const response = await fetch(`${origin}/files`, {
            body: '--boundary\r\nContent-Disposition: form-data; name="files"; filename="sound.wav"\r\nContent-Type: audio/wav\r\n\r\nsound',
            headers: {
                "Content-Type": "multipart/form-data; boundary=boundary",
            },
            method: "POST",
        });
        const body = new FormData();
        body.append(
            "file",
            new Blob(["sound"], { type: "audio/wav" }),
            "sound.wav"
        );
        const next = await fetch(`${origin}/file`, { body, method: "PUT" });

        expect(response.status).toBe(500);
        expect(next.status).toBe(200);
    });
});
