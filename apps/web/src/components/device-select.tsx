import React from "react";
import type { SelectOption } from "@/components/select";
import { Select } from "@/components/select";
import { useAudioContext } from "@/hooks/use-audio-context";
import { useAudioDevices } from "@/hooks/use-audio-devices";

const MAX_WIDTH = 320;

type DeviceSelectProps = {
    maxWidth?: `${number}%` | number;
};

const DeviceSelect: React.FC<DeviceSelectProps> = (props) => {
    const { maxWidth = MAX_WIDTH } = props;
    const { data: audioDevices = [], isLoading } = useAudioDevices({
        enabled: true,
    });
    const { device, setDevice } = useAudioContext();
    const options = audioDevices.map(
        (audioDevice): SelectOption => ({
            icon:
                audioDevice.kind === "audioinput" ? "Microphone" : "Headphones",
            label: audioDevice.label,
            value: audioDevice.deviceId,
        })
    );

    const handleChange = (deviceId: string) => {
        const selectedDevice = audioDevices.find(
            (device) => device.deviceId === deviceId
        );

        setDevice(selectedDevice);
    };

    if (isLoading) {
        return null;
    }

    return (
        <Select
            maxWidth={maxWidth}
            onChange={handleChange}
            options={options}
            placeholder="Select a device..."
            value={device?.deviceId}
        />
    );
};

export { DeviceSelect };
