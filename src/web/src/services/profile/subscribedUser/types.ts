


export interface SubscribedUser {
    username: string;
    picture?: string;
    is_subscribed: boolean;
}

export interface SubscribedUserManager {
    list: SubscribedUser[];
    isLoading: boolean;
    isSuccess: boolean;
    isFetching: boolean;
    isRefetching: boolean;
    refresh: () => Promise<void>;
}