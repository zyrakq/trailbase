export interface CommentRefreshRequest {
    uuid: string;
    additional: AdditionalInfo;
}

export interface AdditionalInfo {
    list_uuid: string;
}
