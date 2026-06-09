export interface PostModel {
    uuid: string;
    text: string;
    teaser: string;
    preview: string;
    files: string[];
    access_type: 'public' | 'subscription' | 'one-time' | 'one-time_or_subscription';
    subscription_types: string[];
    access: boolean;
    published_at: string;
}


export interface PostResultModel {
    total: number;
    offset: number;
    count: number;
    items: PostModel[]
}

export interface LoadMoreRowsProps { 
    sub: string; 
    offset: number; 
    limit: number; 
    isPrivate: boolean
  }


export interface PostListManager {
    isLoading: boolean;
    isFetching: boolean;
    isRefetching: boolean;
    isSuccess: boolean;
  
    list: PostModel[];
    count: number;
    total: number;
    onChange: (newData: {items: PostModel[]; total: number;}) => Promise<void>;
}