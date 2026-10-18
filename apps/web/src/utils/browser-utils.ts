import type { Result } from "common";
import { err, ok, UnhandledError, ValidationError } from "common";
import { isEmpty } from "lodash-es";

const hasAudioPermission = async (): Promise<boolean> => {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        return true;
    } catch (error) {
        return false;
    }
};

const getAudioDevices = async (): Promise<Result<MediaDeviceInfo[], Error>> => {
    if (!(await hasAudioPermission())) {
        return err(
            new ValidationError(
                "You need to enable audio permissions to select a different audio device."
            )
        );
    }
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return ok(
            devices.filter(
                (device) =>
                    !isEmpty(device.label) &&
                    !device.label.toLowerCase().includes("default") &&
                    device.kind === "audiooutput"
            )
        );
    } catch (cause) {
        return err(
            cause instanceof Error
                ? cause
                : new UnhandledError("Audio devices could not be retrieved.")
        );
    }
};

export { getAudioDevices, hasAudioPermission };
