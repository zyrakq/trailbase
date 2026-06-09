
export interface UserInfo{
    sub: string;
    username: string;
    is_author: boolean;
    currency: string;
    picture?: string;
    
}

export interface ProfileManager {
    user: UserInfo;
    isLoading: boolean;
    isSuccess: boolean;
    isFetching: boolean;
    isRefetching: boolean;
    refresh: () => Promise<void>;
  }