export interface CommentListResult {
    total: number;
    fullTotal: number;
    list: CommentModel[];
}

export interface CommentModel {
    uuid: string,
    text: string,
    files: string[],
    created_at: string,
    updated_at: string,
    deleted_at: string | undefined,
    replies: ReplyModel[],
    sub: string,
    username: string,
    picture: string | undefined,
}

export interface ReplyModel {
    uuid: string,
    text: string,
    files: string[],
    created_at: string,
    updated_at: string,
    deleted_at: string | undefined,
    reply_uuid: string,
    sub: string,
    username: string,
    picture: string | undefined,
}


export interface CommentListManager {
    uuid: string,

    isLoading: boolean;
    isFetching: boolean;
    isRefetching: boolean;
    isSuccess: boolean;

    list: CommentModel[],
    count: number,
    total: number,
    fullTotal: number,
    render?:() => void,
}

export interface CommentListRequest {
    uuid: string;
    offset: number;
    limit: number;
    isPrivate: boolean
}

/************************loader******************/

export interface CommentListLoader  {
    isSuccess: boolean;
    load: () => Promise<void>;
}

/************************loader******************/

/************************refresher******************/
export interface CommentListRefresher  {
    isSuccess: boolean;
    refresh: () => Promise<void>;
}

export interface CommentListRefreshRequest {
    uuid: string;
    created_at: Date;
    isPrivate: boolean
}

/************************refresher******************/
