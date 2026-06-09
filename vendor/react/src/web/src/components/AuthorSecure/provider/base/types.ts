export interface AuthorInfo{
    sub:string;
    username:string;
    subscribed_user_count: number;
    picture?: string;
}

export interface AuthorManager {
    author: AuthorInfo;
    isFollowed: boolean;
    isSubscribed: boolean;
    isCurrentUser: boolean;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    isFetching: boolean;
    isRefetching: boolean;
    refresh: () => Promise<void>;
}