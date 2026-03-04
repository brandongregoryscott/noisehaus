const hasAudioPermission = async (): Promise<boolean> => {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        return true;
    } catch (error) {
        return false;
    }
};

export { hasAudioPermission };
