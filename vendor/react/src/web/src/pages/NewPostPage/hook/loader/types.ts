


export enum PostAccessType {
    Public = 'public',
    Subscription = 'subscription',
    OneTime = 'one-time',
    OneTimeOrSubscription = 'one-time_or_subscription'
}


export interface Draft {
    uuid: string,
    text: string;
    teaser: string;
    files: string[];
    preview: string;
    access_type: PostAccessType;
    subscription_types: string[];
    created_at: string;
    updated_at: string;
}


export interface AdditionalInfo {
    sub: string,
}

export interface DraftListManager {
    list: Draft[];
    count: number;
    isLoading: boolean;
    isFetching: boolean;
    refresh: () => Promise<void>;
}