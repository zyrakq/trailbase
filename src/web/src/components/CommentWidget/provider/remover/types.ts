
export interface AdditionalInfo {
    list_uuid: string;
    deleted_at?: string;
}

export interface CommentRemoverManager {
    isLoading: boolean;
    isDeleted: boolean;
    isRestored: boolean;
    remove: () => Promise<void>;
    restore: () => Promise<void>;
}
