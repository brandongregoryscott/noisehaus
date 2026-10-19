import { useQuery } from "@tanstack/react-query";
import { getAudioDevices } from "@/utils/browser-utils";
import { toQueryPromise } from "@/utils/query-result";

type UseAudioDevicesOptions = {
    enabled?: boolean;
};

const useAudioDevices = (options: UseAudioDevicesOptions) => {
    const { enabled = false } = options;
    return useQuery({
        enabled,
        queryFn: () => toQueryPromise(getAudioDevices()),
        queryKey: ["audioDevices"],
    });
};

export { useAudioDevices };
