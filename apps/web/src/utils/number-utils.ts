const formatSize = (sizeInBytes: number): string =>
    `${sizeInBytes / 1024 / 1024} MB`;

export { formatSize };
