import { useQuery } from "@tanstack/react-query";
import { hasAudioPermission } from "@/utils/browser-utils";

const sleep = async (timeInMs: number) =>
    new Promise((resolve) => setTimeout(resolve, timeInMs));

const useHasAudioPermission = () => {
    return useQuery({
        networkMode: "always",
        queryFn: async () => {
            await sleep(500);
            return hasAudioPermission();
        },
        queryKey: ["hasAudioPermission"],
    });
};

export { useHasAudioPermission };
