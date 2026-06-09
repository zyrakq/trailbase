export interface AdditionalInfo {
    sub: string,
}

export interface DraftChangerManager {
    remove: (uuid: string) => Promise<void>;
    save: () => Promise<void>;
}