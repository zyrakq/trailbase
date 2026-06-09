export interface ReplyRefreshRequest {
    uuid: string;
    additional: AdditionalInfo;
}

export interface AdditionalInfo {
    source_uuid: string;
    list_uuid: string;
}
