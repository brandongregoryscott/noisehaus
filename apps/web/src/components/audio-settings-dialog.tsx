import React from "react";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { Column } from "@/components/column";
import { DeviceSelect } from "@/components/device-select";
import { Field } from "@/components/field";
import { Heading } from "@/components/heading";
import { Icon } from "@/components/icon";
import {
    ResponsiveDialog,
    ResponsiveDialogBody,
    ResponsiveDialogFooter,
    ResponsiveDialogHeader,
} from "@/components/responsive-dialog";
import { Spinner } from "@/components/spinner";
import { useHasAudioPermission } from "@/hooks/use-has-audio-permission";

type AudioSettingsDialogProps = {
    isOpen: boolean;
    onClose: () => void;
};

const AudioSettingsDialog: React.FC<AudioSettingsDialogProps> = (props) => {
    const { isOpen, onClose } = props;
    const { data: hasAudioPermission, isLoading: isLoadingAudioPermission } =
        useHasAudioPermission();
    const renderAudioDeviceError =
        !isLoadingAudioPermission && hasAudioPermission === false;
    const renderDeviceSelect =
        !isLoadingAudioPermission && hasAudioPermission === true;
    return (
        <ResponsiveDialog isOpen={isOpen} onClose={onClose}>
            <ResponsiveDialogHeader>
                <Heading size="h3">Audio Settings</Heading>
            </ResponsiveDialogHeader>
            <ResponsiveDialogBody>
                {isLoadingAudioPermission && (
                    <Column
                        css={{
                            alignItems: "center",
                            height: 48,
                            justifyContent: "center",
                            width: "100%",
                        }}>
                        <Spinner />
                    </Column>
                )}
                {renderAudioDeviceError && (
                    <Alert
                        description={
                            <>
                                <span>
                                    We couldn't retrieve your audio devices. You
                                    might need to open your browser settings and
                                    allow noise.haus access to your microphone.
                                </span>
                                <span>
                                    noise.haus doesn't use your microphone, but
                                    requires this browser permission to list
                                    your available audio devices.
                                </span>
                            </>
                        }
                        icon={<Icon name="TriangleExclamationMark" size={48} />}
                        title="Error retrieving audio devices"
                    />
                )}
                {renderDeviceSelect && (
                    <Field
                        description="If you want to play sounds from a different audio device (such as a virtual one, for routing to other applications), select the device here."
                        label="Audio Device">
                        <DeviceSelect maxWidth="100%" />
                    </Field>
                )}
            </ResponsiveDialogBody>
            <ResponsiveDialogFooter>
                <Button onClick={onClose}>Done</Button>
            </ResponsiveDialogFooter>
        </ResponsiveDialog>
    );
};

export { AudioSettingsDialog };
