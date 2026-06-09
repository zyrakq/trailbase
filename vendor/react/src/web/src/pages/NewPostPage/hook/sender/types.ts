export interface AdditionalInfo {
    sub: string,
}

export interface PostSenderManager {
    isLoading: boolean;
    send: () => Promise<{ uuid: string; }>;
}