import {
    useCallback,
    useMemo,
  } from 'react';

import { useProfile } from '@/services/profile';
import { delete_avatar, save_avatar } from './fake';
import { AvatarManager } from './types';
import { useMutation } from "@tanstack/react-query";


export type { AvatarManager } from './types';

export const useAvatar = (): AvatarManager => {

  const { user, isFetching: isFetchingProfile, refresh: refreshProfile } = useProfile();

  const { mutateAsync: saveAsync, isPending: isLoadingSaved } = useMutation({
    mutationFn: async (blob: Blob) => await save_avatar(blob, user.username),
    //{ mutationKey: ['user', user.sub] }
  });

  const { mutateAsync: deleteAsync, isPending: isLoadingDeleted } = useMutation({
    mutationFn: async () => await delete_avatar(user.username),
    //{ mutationKey: ['user', user.sub] }
  });

  const isLoading = useMemo(
    () => isFetchingProfile || isLoadingSaved || isLoadingDeleted,
    [isFetchingProfile, isLoadingSaved, isLoadingDeleted]
  );

  const saveAvatar = useCallback(async (blob: Blob) => {

    await saveAsync(blob);

    await refreshProfile();

  }, [saveAsync, refreshProfile]);

  const deleteAvatar = useCallback(async () => {

    await deleteAsync();

    await refreshProfile();

  }, [deleteAsync, refreshProfile]);

  return {
    isLoading,
    saveAvatar,
    deleteAvatar
   };
};
