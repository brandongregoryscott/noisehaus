import type { FormEvent } from "react";
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_IN_BYTES } from "common";
import { first, isEmpty } from "lodash-es";
import { useRef, useState } from "react";
import { Box } from "@/components/box";
import { Button } from "@/components/button";
import { CoolButton } from "@/components/cool-button";
import { Icon } from "@/components/icon";
import { InputErrorDisplay } from "@/components/input-error-display";
import { Text } from "@/components/text";
import { FILE_UPLOAD_PLACEHOLDER } from "@/constants/files";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { formatSize } from "@/utils/number-utils";
import { styled } from "@/utils/theme";

type FileUploadProps = {
    errorMessage?: string;
    onChange: (file: File | null | undefined) => void;
    value: File | undefined;
};

const FileUpload: React.FC<FileUploadProps> = (props) => {
    const { errorMessage: errorMessageProp, onChange, value } = props;
    const breakpoint = useBreakpoint();
    const [key, setKey] = useState<number>(0);
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>(
        undefined
    );
    const inputRef = useRef<HTMLInputElement | null>(null);

    const hasError =
        errorMessage !== undefined || errorMessageProp !== undefined;
    const hasValue = value != null;

    const handleClick = () => {
        inputRef.current?.showPicker();
    };

    const handleDropzoneClick = (event: FormEvent<HTMLDivElement>) => {
        if (breakpoint === "mobile") {
            return;
        }

        event.stopPropagation();

        inputRef.current?.showPicker();
    };

    const handleChange = (fileList: FileList | null) => {
        setErrorMessage(undefined);
        setKey((prev) => prev + 1);
        const files = Array.from(fileList ?? []);
        const file = first(files);

        if (file === undefined) {
            onChange(null);
            return;
        }

        if (file.size > MAX_FILE_SIZE_IN_BYTES) {
            setErrorMessage(getMaxSizeErrorMessage(file));
            return;
        }

        if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
            setErrorMessage(getTypeErrorMessage(file));
            return;
        }

        onChange(file);
        setIsFocused(false);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleChange(event.target.files);
    };

    const handleRemove = () => {
        onChange(null);
        setKey((prev) => prev + 1);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "copy";
        setErrorMessage(undefined);

        const dragItems = getFileDataTransferItems(event.dataTransfer.items);

        if (isEmpty(dragItems)) {
            return;
        }

        if (dragItems.length > 1) {
            setErrorMessage(getMaxFilesErrorMessage());
            return;
        }

        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setErrorMessage(undefined);
        setIsDragging(false);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();

        handleChange(event.dataTransfer.files);
        setIsDragging(false);
    };

    const handleFocus = () => {
        if (breakpoint === "mobile") {
            return;
        }

        setIsFocused(true);
    };

    const handleBlur = () => {
        if (breakpoint === "mobile") {
            return;
        }

        setIsFocused(false);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== "Enter" && event.key !== " ") {
            return;
        }

        event.preventDefault();
        inputRef.current?.showPicker();
    };

    return (
        <StyledFileUploadContainer hasError={hasError} isFocused={isFocused}>
            <input
                accept={ACCEPTED_MIME_TYPES.join(",")}
                hidden={true}
                key={key}
                multiple={false}
                onChange={handleInputChange}
                ref={inputRef}
                type="file"
            />
            {!hasValue || hasError ? (
                <Box
                    css={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                    }}>
                    <StyledFileDropzone
                        breakpoint={breakpoint}
                        hasError={hasError}
                        isDragging={isDragging}
                        onClick={handleDropzoneClick}>
                        <Box
                            css={{
                                "&:focus": {
                                    outline: "none",
                                },
                                alignItems: "center",
                                display: "flex",
                                flexDirection: "column",
                                padding: 16,
                                rowGap: 8,
                                width: "100%",
                            }}
                            onBlur={handleBlur}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onFocus={handleFocus}
                            onKeyDown={handleKeyDown}
                            tabIndex={breakpoint === "mobile" ? -1 : 0}>
                            <Icon
                                color="$white"
                                name="CircleArrowUp"
                                size={28}
                            />
                            <Text fontWeight="bold">Choose a Sound</Text>
                            <Text as="code" textAlign="center">
                                {FILE_UPLOAD_PLACEHOLDER}
                            </Text>
                        </Box>
                    </StyledFileDropzone>
                    {hasError && (
                        <InputErrorDisplay
                            errorMessage={errorMessage ?? errorMessageProp}
                        />
                    )}
                </Box>
            ) : (
                <>
                    <Box
                        css={{
                            alignItems: "center",
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                        }}>
                        <Box as="span" css={{ fontWeight: "bold" }}>
                            Sound File
                        </Box>
                        <Button
                            autoFocus={true}
                            colorType="Destructive"
                            fillStyle="Solid"
                            onClick={handleRemove}
                            size="Small">
                            Remove
                        </Button>
                    </Box>
                    <Box css={{ display: "flex" }}>
                        <Box as="span">{value.name}</Box>
                    </Box>
                </>
            )}
            {breakpoint === "mobile" && (!hasValue || hasError) && (
                <CoolButton intent="primary" onClick={handleClick} width="100%">
                    Open Files
                </CoolButton>
            )}
        </StyledFileUploadContainer>
    );
};

const StyledFileUploadContainer = styled("div", {
    borderRadius: 8,
    compoundVariants: [
        {
            css: {
                focusRing: "$danger",
            },
            hasError: true,
            isFocused: true,
        },
        {
            css: {
                focusRing: "$white",
            },
            hasError: false,
            isFocused: true,
        },
    ],
    display: "flex",
    flexDirection: "column",
    gap: 8,
    userSelect: "none",
    variants: {
        hasError: {
            true: {},
        },
        isFocused: {
            true: {},
        },
    },
    width: "100%",
});

const StyledFileDropzone = styled("div", {
    backgroundColor: "$black",
    borderRadius: 8,
    compoundVariants: [
        {
            breakpoint: "desktop",
            css: {
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                border: "1px dashed $white",
            },
            isDragging: true,
        },
        {
            breakpoint: "desktop",
            css: {
                "&:hover": {
                    border: "1px dashed rgba(255, 255, 255, 0.2)",
                },
            },
            hasError: false,
        },
        {
            breakpoint: "desktop",
            css: {
                border: "1px solid $danger",
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
            },
            hasError: true,
        },
    ],
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    variants: {
        breakpoint: {
            desktop: {
                "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
                border: "1px dashed rgba(255, 255, 255, 0.1)",
            },
            mobile: {},
        },
        hasError: {
            true: {
                border: "1px solid $danger",
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
            },
        },
        isDragging: {
            true: {},
        },
    },
    width: "100%",
});

/**
 * Converts `DataTransferItemList` to an array of `DataTransferItem` objects filtered by the 'file' `kind`
 *
 * The other possible `kind` is 'string', but we don't really care about text being dragged onto
 * the dropzone
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem/
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem/kind
 *
 * @param {DataTransferItemList} dataTransferList
 * @returns {DataTransferItem[]}
 */
const getFileDataTransferItems = (
    dataTransferList: DataTransferItemList
): DataTransferItem[] => {
    if (isEmpty(dataTransferList)) {
        return [];
    }

    return Array.from(dataTransferList).filter(
        (dataTransferItem) => dataTransferItem.kind === "file"
    );
};

const getMaxFilesErrorMessage = (): string =>
    "Only one file can be uploaded at a time.";

const getMaxSizeErrorMessage = (file: File): string =>
    `File '${file.name}' is over ${formatSize(
        MAX_FILE_SIZE_IN_BYTES
    )}. Please choose another file.`;

const getTypeErrorMessage = (file: File): string =>
    `File '${file.name}' was rejected due to its file type.`;

export { FileUpload };
