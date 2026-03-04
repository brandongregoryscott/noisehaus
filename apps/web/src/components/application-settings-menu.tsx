import { Box } from "@/components/box";
import { Button } from "@/components/button";
import { Icon } from "@/components/icon";
import { IconButton } from "@/components/icon-button";
import { Popover } from "@/components/popover";

type ApplicationSettingsMenuProps = {
    onAudioSettingsClick: () => void;
};

const ApplicationSettingsMenu: React.FC<ApplicationSettingsMenuProps> = (
    props
) => {
    const { onAudioSettingsClick } = props;
    return (
        <Popover.Root>
            <Popover.Trigger asChild={true}>
                <IconButton fillStyle="Ghost" iconName="Person" />
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content>
                    <Button fillStyle="Ghost" onClick={onAudioSettingsClick}>
                        <Box
                            css={{
                                alignItems: "center",
                                display: "flex",
                                gap: 4,
                            }}>
                            <Icon name="Volume" />
                            <span>Audio Settings</span>
                        </Box>
                    </Button>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
};

export { ApplicationSettingsMenu };
