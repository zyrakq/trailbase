import {
  useCallback,
    useMemo,
  } from 'react';

import { useProfile, useSubscribedUser } from '@/services/profile';
import { useAuthor } from '@/components/AuthorSecure';

import { add_subscribed_user, delete_subscribed_user } from './fake';
import { AddSubscribedUser, DelSubscribedUser, SubscribedAuthorManager } from './types';
import { useMutation } from "@tanstack/react-query";


export type { SubscribedAuthorManager } from './types';

export const useSubscribedAuthor = (): SubscribedAuthorManager => {

  const {
    author,
    isFetching: isFetchingAuthor,
    refresh: refreshAuthor
  } = useAuthor();

  const {
    isFetching: isFetchingSubscribedUsers,
    refresh: refreshSubscribedUsers
  } = useSubscribedUser();

  const { user } = useProfile();

  const { mutateAsync: followAsync, isPending: isLoadingFollowed } = useMutation({
    mutationFn: async (data: AddSubscribedUser) => await add_subscribed_user(data),
    //{ mutationKey: ['user', user.sub] }
  });

  const { mutateAsync: stopFollowAsync, isPending: isLoadingStopFollowed } = useMutation({
    mutationFn: async (data: DelSubscribedUser) => await delete_subscribed_user(data),
    //{ mutationKey: ['user', user.sub] }
  });

  const isLoading = useMemo(
    () => isFetchingAuthor || isFetchingSubscribedUsers || isLoadingFollowed || isLoadingStopFollowed,
    [isFetchingAuthor, isFetchingSubscribedUsers, isLoadingFollowed, isLoadingStopFollowed]
  );

  const follow = useCallback(async () => {

    const additional = {
      sub: user.sub,
      subscribed_user: {
        username: author.username,
        picture: author.picture,
        is_subscribed: false
      }
    };

    await followAsync({
      subscribed_user_uuid: author.sub,
      additional
    });

    await refreshAuthor();

    await refreshSubscribedUsers();

  }, [user, author, followAsync, refreshAuthor, refreshSubscribedUsers]);

  const stopFollowing = useCallback(async () => {

    const additional = {
      sub: user.sub,
      subscribed_user: {
        username: author.username,
        picture: author.picture,
        is_subscribed: false
      }
    };

    await stopFollowAsync({
      subscribed_user_uuid: author.sub,
      additional
    });

    await refreshAuthor();

    await refreshSubscribedUsers();

  }, [user, author, stopFollowAsync, refreshAuthor, refreshSubscribedUsers]);

  return {
    isLoading,
    follow,
    stopFollowing,
   };
};
