import { ReplyModel } from "@/components/CommentList";

export interface ReplyListRequest {
    uuid: string;
    offset: number;
    limit: number;
    isPrivate: boolean;
    additional: AdditionalInfo;
}
export interface AdditionalInfo {
    source_uuid: string;
}

export interface ReplyListResult {
    total: number;
    list: ReplyModel[];
}

export interface ReplyListManager {
    uuid: string;

    isLoading: boolean;
    isFetching: boolean;
    isRefetching: boolean;
    isSuccess: boolean;

    list: ReplyModel[],
    count: number,
    total: number,
    render?: () => void,

    additional: {
        source_uuid: string;
    };
}

/************************loader******************/

export interface ReplyListLoader  {
    isSuccess: boolean;
    load: () => Promise<void>;
}

/************************loader******************/
