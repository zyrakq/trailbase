
export interface AdditionalInfo {
    source_uuid: string;
    list_uuid: string;
    deleted_at?: string;
}

export interface ReplyRemoverManager {
    isLoading: boolean;
    isDeleted: boolean;
    isRestored: boolean;
    remove: () => Promise<void>;
    restore: () => Promise<void>;
}
