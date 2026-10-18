import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BoardFilesStore } from "@/board-files/store";
import { PocketBaseClient } from "@/pocketbase-client";

const record = {
    boardId: "board-a",
    createdAt: "2026-10-17T00:00:00Z",
    displayName: "Sound",
    emoji: "",
    file: "sound.wav",
    id: "file-a",
    position: 0,
    size: 5,
    updatedAt: "2026-10-17T00:00:00Z",
};
const file = {
    buffer: Buffer.from("sound"),
    mimetype: "audio/wav",
    originalname: "sound.wav",
    size: 5,
};

describe("BoardFilesStore", () => {
    beforeEach(() => {
        vi.spyOn(PocketBaseClient, "createRecords").mockResolvedValue([
            record,
            { ...record, id: "file-b" },
        ]);
        vi.spyOn(PocketBaseClient, "updateRecord").mockResolvedValue(record);
        vi.spyOn(PocketBaseClient, "deleteRecord").mockResolvedValue();
    });
    afterEach(() => vi.restoreAllMocks());

    it("encodes all sounds in one atomic batch and maps records to board files", async () => {
        const input = [
            {
                boardId: record.boardId,
                displayName: "First",
                emoji: "",
                file,
                size: file.size,
            },
            {
                boardId: record.boardId,
                displayName: "Second",
                emoji: ":smile:",
                file,
                size: file.size,
            },
        ];

        const result = await BoardFilesStore.bulkInsert(input);

        expect(result.map((sound) => sound.id)).toEqual(["file-a", "file-b"]);
        expect(result[0].emoji).toBeNull();
        expect(result[0]).not.toHaveProperty("file");
        expect(PocketBaseClient.createRecords).toHaveBeenCalledTimes(1);
        const [requests] = vi.mocked(PocketBaseClient.createRecords).mock
            .calls[0];
        expect(requests).toHaveLength(2);
        expect(requests[0].collection).toBe("boardFiles");
        const first = requests[0].data as FormData;
        const second = requests[1].data as FormData;
        expect(first.get("boardId")).toBe("board-a");
        expect(first.get("displayName")).toBe("First");
        expect(first.get("emoji")).toBe("");
        expect(first.get("size")).toBe("5");
        const uploaded = first.get("file") as File;
        expect(uploaded.name).toBe("sound.wav");
        expect(uploaded.type).toBe("audio/wav");
        expect(await uploaded.text()).toBe("sound");
        expect(second.get("displayName")).toBe("Second");
        expect(second.get("emoji")).toBe(":smile:");
    });

    it("propagates batch failure without retrying individual sounds or compensating deletes", async () => {
        const error = new Error("Second sound failed");
        vi.mocked(PocketBaseClient.createRecords).mockRejectedValue(error);
        const input = [
            {
                boardId: record.boardId,
                displayName: "Sound",
                emoji: "",
                file,
                size: file.size,
            },
        ];

        const result = BoardFilesStore.bulkInsert(input);

        await expect(result).rejects.toBe(error);
        expect(PocketBaseClient.createRecords).toHaveBeenCalledTimes(1);
        expect(PocketBaseClient.deleteRecord).not.toHaveBeenCalled();
    });

    it("sends metadata-only changes as JSON", async () => {
        const input = { displayName: "Renamed", emoji: "" };

        await BoardFilesStore.update(record.id, input);

        expect(PocketBaseClient.updateRecord).toHaveBeenCalledExactlyOnceWith(
            "boardFiles",
            record.id,
            input
        );
    });

    it("writes replacement audio and metadata together", async () => {
        const input = { displayName: "Replaced", file, size: file.size };

        await BoardFilesStore.update(record.id, input);

        expect(PocketBaseClient.updateRecord).toHaveBeenCalledTimes(1);
        const [collection, id, data] = vi.mocked(PocketBaseClient.updateRecord)
            .mock.calls[0];
        expect(collection).toBe("boardFiles");
        expect(id).toBe(record.id);
        const form = data as FormData;
        expect(form.get("displayName")).toBe("Replaced");
        expect(form.get("size")).toBe("5");
        expect(await (form.get("file") as File).text()).toBe("sound");
    });

    it("keeps file tokens and provider filenames inside the store", async () => {
        vi.spyOn(PocketBaseClient, "listRecords").mockResolvedValue([record]);
        vi.spyOn(PocketBaseClient, "getFileToken").mockResolvedValue(
            "file-token"
        );
        vi.spyOn(PocketBaseClient, "getFileUrl").mockReturnValue(
            "https://example.com/sound"
        );

        const result = await BoardFilesStore.listWithPresignedUrls(
            record.boardId
        );

        expect(PocketBaseClient.listRecords).toHaveBeenCalledWith(
            "boardFiles",
            {
                filter: 'boardId = "board-a"',
                sort: "position,createdAt",
            }
        );
        expect(PocketBaseClient.getFileUrl).toHaveBeenCalledWith(
            "boardFiles",
            record.id,
            record.file,
            "file-token"
        );
        expect(result[0]).toMatchObject({
            id: record.id,
            signedUrl: "https://example.com/sound",
        });
        expect(result[0]).not.toHaveProperty("file");
    });
});
