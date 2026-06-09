export interface AvatarManager {
    isLoading: boolean;
    saveAvatar: (blob: Blob) => Promise<void>;
    deleteAvatar: () => Promise<void>;
}