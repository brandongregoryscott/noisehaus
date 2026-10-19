import { afterEach, assert, describe, expect, it, vi } from "vitest";
import { getAudioDevices, hasAudioPermission } from "./browser-utils";

const createDevice = (
    label: string,
    kind: MediaDeviceKind
): MediaDeviceInfo => ({
    deviceId: label,
    groupId: "group",
    kind,
    label,
    toJSON: () => ({}),
});

describe("getAudioDevices", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("returns a validation result when audio permission is denied", async () => {
        const enumerateDevices = vi.fn();
        vi.stubGlobal("navigator", {
            mediaDevices: {
                enumerateDevices,
                getUserMedia: vi.fn().mockRejectedValue(new Error("Denied")),
            },
        });

        const result = await getAudioDevices();
        const permission = await hasAudioPermission();

        assert(result.isValidationError());
        expect(result.error.message).toContain("enable audio permissions");
        expect(enumerateDevices).not.toHaveBeenCalled();
        expect(permission).toBe(false);
    });

    it("returns usable output devices and filters unsupported choices", async () => {
        const speaker = createDevice("Speakers", "audiooutput");
        vi.stubGlobal("navigator", {
            mediaDevices: {
                enumerateDevices: vi
                    .fn()
                    .mockResolvedValue([
                        speaker,
                        createDevice("", "audiooutput"),
                        createDevice("Default output", "audiooutput"),
                        createDevice("Microphone", "audioinput"),
                    ]),
                getUserMedia: vi.fn().mockResolvedValue({}),
            },
        });

        const result = await getAudioDevices();

        assert(result.isOk);
        expect(result.value).toEqual([speaker]);
    });

    it("returns device enumeration failures without rejecting", async () => {
        const error = new Error("Devices unavailable");
        vi.stubGlobal("navigator", {
            mediaDevices: {
                enumerateDevices: vi.fn().mockRejectedValue(error),
                getUserMedia: vi.fn().mockResolvedValue({}),
            },
        });

        const result = await getAudioDevices();

        assert(result.isErr);
        expect(result.error).toBe(error);
    });
});
