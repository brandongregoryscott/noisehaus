import { useQuery } from "@tanstack/react-query";
import { isEmpty } from "lodash-es";
import { hasAudioPermission } from "@/utils/browser-utils";

type UseAudioDevicesOptions = {
    enabled?: boolean;
};

const useAudioDevices = (options: UseAudioDevicesOptions) => {
    const { enabled = false } = options;
    return useQuery({
        enabled,
        queryFn: async () => {
            if (!(await hasAudioPermission())) {
                throw new Error(
                    "You need to enable audio permissions to select a different audio device."
                );
            }

            const devices = await navigator.mediaDevices.enumerateDevices();

            return devices.filter(
                (device) =>
                    !isEmpty(device.label) &&
                    !device.label.toLowerCase().includes("default") &&
                    device.kind === "audiooutput"
            );
        },
        queryKey: ["audioDevices"],
    });
};

export { useAudioDevices };
