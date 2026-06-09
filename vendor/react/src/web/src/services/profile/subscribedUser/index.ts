import { useCallback } from 'react';
import { useQuery } from "@tanstack/react-query";

import { useProfile } from '@/services/profile';

import { SubscribedUserManager } from './types';
import { get_subs } from './fake';


export type { SubscribedUserManager, SubscribedUser } from './types';


export const useSubscribedUser = (): SubscribedUserManager => {

    const { user, isFetching: isFetchingProfile, isSuccess: isSuccessProfile } = useProfile();

    const uploadSubscribedUser = useCallback(async() => {
        return await get_subs(user.sub);
    }, [user.sub]);

    const {
        data: list = [],
        isLoading,
        isSuccess,
        isFetching,
        isRefetching,
        refetch
    } = useQuery({
        queryKey: ['subscribed-user', user.sub],
        queryFn: async() => await uploadSubscribedUser(),
        enabled: (!isFetchingProfile && isSuccessProfile),
        refetchOnMount: false
    });

    const refresh = useCallback(async () => {

        await refetch();

      }, [refetch]);


    return {
        list,
        isLoading,
        isSuccess,
        isFetching,
        isRefetching,
        refresh
    };
};
