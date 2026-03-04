import type { Dispatch, SetStateAction } from "react";
import { noop } from "lodash-es";
import { createContext, useMemo, useState } from "react";

type AudioContext = {
    device: MediaDeviceInfo | undefined;
    setDevice: Dispatch<SetStateAction<MediaDeviceInfo | undefined>>;
};

type AudioContextProviderOptions = {
    children: React.ReactNode;
};

const DEFAULT_AUDIO_CONTEXT_VALUE: AudioContext = {
    device: undefined,
    setDevice: noop,
};

const AudioContext = createContext<AudioContext>(DEFAULT_AUDIO_CONTEXT_VALUE);

const AudioContextProvider: React.FC<AudioContextProviderOptions> = (props) => {
    const { children } = props;
    const [device, setDevice] = useState<MediaDeviceInfo | undefined>(
        undefined
    );
    const value = useMemo(() => ({ device, setDevice }), [device]);

    return (
        <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
    );
};

export { AudioContext, AudioContextProvider };
