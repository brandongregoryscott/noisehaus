const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) {
        return `${sizeInBytes} bytes`;
    }

    const sizeInMb = sizeInBytes / 1024 / 1024;

    return `${sizeInMb.toFixed(1)} MB`;
};

export { formatFileSize };
