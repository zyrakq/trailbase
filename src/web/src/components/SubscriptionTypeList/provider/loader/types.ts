
export interface SubscriptionTypeModel {
    uuid: string;
    title:string;
    amount: number;
    picture: string | undefined;
    description: string | undefined;
}

export enum LoadingStatus {
    Loaded,
    NotFound,
    LoadingError,
    Loading,
    NotInitialized
}

export interface AdditionalInfo {
    currentUserSub: string;
}

export interface SubscriptionTypeResult {
    list: SubscriptionTypeModel[];
    status: LoadingStatus;
}
  
export interface SubscriptionTypeListLoaderManager {
    list: SubscriptionTypeModel[];
    status: LoadingStatus;
}