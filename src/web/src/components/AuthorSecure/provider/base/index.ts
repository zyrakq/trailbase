import {
    useMemo,
    useCallback,
    useEffect,
  } from 'react';

import { get_author_info } from './fake';
import { AuthorInfo, AuthorManager } from './types';
import { useProfile, useSubscribedUser } from '@/services/profile';
import { useSuspenseQuery } from "@tanstack/react-query";
//import { useOidc } from '@axa-fr/react-oidc';
import { useParams } from 'react-router-dom';

export type { AuthorManager } from './types';

export const useAuthor = (): AuthorManager => {

  const { username = "" } = useParams();

  //const { isAuthenticated } = useOidc();

  const {
    user,
    isRefetching: isRefetchingProfile,
    isSuccess: isSuccessProfile,
    //refresh: refreshProfile
  } = useProfile();

  const { list } = useSubscribedUser();

  const isCurrentUser = useMemo(() => isSuccessProfile && (username === user.username),
    [username, user.username, isSuccessProfile]
  );

  const {
    data: author = {} as AuthorInfo,
    isLoading,
    isSuccess,
    isError,
    isFetching,
    isRefetching,
    refetch
  } = useSuspenseQuery({
    queryKey: ['author', username],
    queryFn: async() => await get_author_info(username),
      // enabled: ((isAuthenticated && isSuccessProfile) || !isAuthenticated),
      refetchOnMount: false
  });

  const isFollowed = useMemo(
    () => !!list.find(x => x.username === username),
    [list, username]
  );

  const isSubscribed = useMemo(
    () => !!list.find(x => x.username === username && x.is_subscribed),
    [list, username]
  );

  useEffect(() => {
    if (isCurrentUser && isRefetchingProfile) refetch();
  },[isCurrentUser, isRefetchingProfile, refetch]);

  const refresh = useCallback(async () => {

    //if (isCurrentUser) await refreshProfile();

    await refetch();

  }, [refetch]);

  return {
    author,
    isFollowed,
    isSubscribed,
    isCurrentUser,
    isLoading,
    isSuccess,
    isError,
    isFetching,
    isRefetching,
    refresh
   };
};
