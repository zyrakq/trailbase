import { PostModel } from "@/components/PostList";

export enum LoadingStatus {
    Loaded,
    Deleted,
    NotFound,
    LoadingError,
    Loading,
    NotInitialized
}

export interface AdditionalInfo {
    sub: string;
}

export interface PostResult {
    post: PostModel;
    status: LoadingStatus;
}

export interface ReceivedPostManager {
    post: PostModel;
    status: LoadingStatus;
}
