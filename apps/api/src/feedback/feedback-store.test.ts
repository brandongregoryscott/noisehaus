import { afterEach, assert, describe, expect, it, vi } from "vitest";
import { FeedbackStore } from "@/feedback/feedback-store";
import { PocketBaseClient } from "@/pocketbase-client";

describe("FeedbackStore", () => {
    afterEach(() => vi.restoreAllMocks());

    it("maps empty optional PocketBase fields to null", async () => {
        vi.spyOn(PocketBaseClient, "createRecord").mockResolvedValue({
            boardId: "",
            comment: "Thanks",
            createdAt: "2026-10-17T00:00:00Z",
            email: "",
            id: "feedback-a",
            respondedAt: "",
        });
        const input = { comment: "Thanks" };

        const result = await FeedbackStore.create(input);
        assert(result.isOk);

        expect(PocketBaseClient.createRecord).toHaveBeenCalledWith(
            "feedback",
            input
        );
        expect(result.value).toEqual({
            boardId: null,
            comment: "Thanks",
            createdAt: "2026-10-17T00:00:00Z",
            email: null,
            id: "feedback-a",
            respondedAt: null,
        });
    });
});
