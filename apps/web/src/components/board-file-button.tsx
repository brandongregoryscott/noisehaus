import type { PresignedBoardFile } from "common";
import { colonCodeToUnicode } from "common";
import { useEffect, useRef, useState } from "react";
import { Column } from "@/components/column";
import { CoolButton } from "@/components/cool-button";
import { Icon } from "@/components/icon";
import { ReelSpinner } from "@/components/reel-spinner";
import { Spinner } from "@/components/spinner";
import { Text } from "@/components/text";
import { useAudioContext } from "@/hooks/use-audio-context";

type BoardFileButtonProps = {
    boardFile: PresignedBoardFile;
};

type AudioElement = {
    setSinkId: (deviceId: string) => Promise<void>;
} & HTMLAudioElement;

const BoardFileButton: React.FC<BoardFileButtonProps> = (props) => {
    const { boardFile } = props;
    const { display_name: displayName, emoji, signedUrl } = boardFile;
    const unicodeEmoji = emoji == null ? undefined : colonCodeToUnicode(emoji);
    const audioRef = useRef<AudioElement | null>(null);
    const { device } = useAudioContext();
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [isLoaded, setIsLoaded] = useState<boolean>(false);

    useEffect(() => {
        const audioElement = audioRef.current;
        if (audioElement === null) {
            return;
        }

        const handleEnded = () => setIsPlaying(false);
        audioElement.addEventListener("ended", handleEnded);

        return function cleanup() {
            audioElement.removeEventListener("ended", handleEnded);
        };
    }, []);

    useEffect(() => {
        const audioElement = audioRef.current;
        if (audioElement === null) {
            return;
        }

        if (device === undefined) {
            return;
        }

        audioElement.setSinkId?.(device?.deviceId);
    }, [device]);

    const handleClick = () => {
        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
            return;
        }

        audioRef.current?.play();
        setIsPlaying(true);
    };

    const handleCanPlay = () => {
        setIsLoaded(true);
        if (isPlaying) {
            audioRef.current?.play();
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
    };

    const handlePause = () => {
        setIsPlaying(false);
    };

    const iconName = isPlaying ? "Pause" : "Play";
    let icon = unicodeEmoji ?? <Icon name={iconName} size={16} />;

    if (isPlaying && !isLoaded) {
        icon = <Spinner color="$black" size="Small" />;
    }

    return (
        <>
            {(isLoaded || isPlaying) && (
                <audio
                    onCanPlay={handleCanPlay}
                    onEnded={handleEnded}
                    onPause={handlePause}
                    ref={audioRef}
                    src={signedUrl}
                />
            )}
            <Column
                css={{
                    alignItems: "center",
                    gap: 8,
                    justifyContent: "center",
                }}>
                <CoolButton
                    height={80}
                    intent="primary"
                    onClick={handleClick}
                    width={80}>
                    <Column
                        css={{
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                        {icon}
                    </Column>
                </CoolButton>
                <Text fontWeight="bold">{displayName}</Text>
            </Column>
        </>
    );
};

export { BoardFileButton };
